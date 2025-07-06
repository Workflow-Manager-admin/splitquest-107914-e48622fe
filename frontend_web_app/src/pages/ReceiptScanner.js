import React, { useRef, useState } from "react";
import { useGroups } from "../GroupsContext";

/**
 * ReceiptScanner component.
 * End-to-end UI and logic for:
 *  - Uploading receipt image
 *  - Running OCR (Tesseract.js if installed, else placeholder)
 *  - Parsing items/prices, letting user edit/add/remove
 *  - Assigning items to group members, with equal/custom split
 *  - Confirming to add expenses and updating dashboard
 *
 * NOTE: If real OCR is not available, marks all such UI as "placeholder/mock".
 */

// Try dynamic import for Tesseract.js; if not present, fallback to stub
let tesseractPromise = null;
function getTesseract() {
  if (!tesseractPromise) {
    try {
      tesseractPromise = import("tesseract.js");
    } catch {
      tesseractPromise = Promise.resolve(null);
    }
  }
  return tesseractPromise;
}

// Utility: naive parser for extracting (item, price) pairs from raw OCR text
function parseReceiptText(text) {
  // Very simple: look for lines like "ItemName ..... 123.45"
  const lines = text.split(/\n/);
  const items = [];
  lines.forEach(line => {
    const m = line.match(/^(.+?)\s+([₹$]?\d+[,.]?\d*)$/i);
    if (m) {
      const name = m[1].replace(/\.{2,}/g, '').trim();
      const priceStr = m[2].replace(/[₹$,]/g, '').trim();
      const price = parseFloat(priceStr);
      if (name && !isNaN(price)) items.push({ name, price });
    }
  });
  // Fallback: if none found & <8 lines, guess all lines except last as items, last as total
  if (items.length === 0 && lines.length < 8) {
    for (let i = 0; i < lines.length - 1; ++i) {
      const name = lines[i].trim();
      if (name) items.push({ name, price: 0 });
    }
    // Try to parse the last line as total
    const last = lines[lines.length - 1] || "";
    const price = parseFloat(last.replace(/[₹$,]/g, '').trim());
    if (!isNaN(price) && items.length) items[items.length - 1].price = price;
  }
  return items;
}

// PUBLIC_INTERFACE
export default function ReceiptScanner({ groupId, onDone }) {
  const { getGroupById, getMembersForGroup, addExpense, currentUserId } = useGroups();
  const group = getGroupById(groupId);
  const members = group ? getMembersForGroup(group) : [];
  const [step, setStep] = useState(0); // 0-upload, 1-OCR/parsing, 2-review, 3-confirmed
  const [imageUrl, setImageUrl] = useState(null);
  const [ocrResult, setOcrResult] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [items, setItems] = useState([]); // [{name, price}]
  const [splitAlloc, setSplitAlloc] = useState([]); // [{memberIds:[], splitType:"equal"/"custom", customSplits:{id:share}}]
  const [loading, setLoading] = useState(false);

  // Step 1: Upload
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setOcrResult("");
    setOcrError("");
    setStep(1);
    setLoading(false);
  }

  // Step 2: OCR
  async function runOcr() {
    setLoading(true);
    setOcrResult("");
    setOcrError("");
    let OCR = null;
    try {
      OCR = await getTesseract();
    } catch {}
    if (!OCR || !OCR.createWorker) {
      setOcrError("OCR engine (Tesseract.js) not installed. Using mock stub.");
      // Mock output for demo only
      setTimeout(() => {
        const text = "Burger     120\nFries      85\nCoke       45\nTotal    250";
        setOcrResult(text);
        setItems(parseReceiptText(text));
        setStep(2);
        setLoading(false);
      }, 1300);
      return;
    }
    // Real OCR path
    try {
      const worker = await OCR.createWorker("eng");
      const { data: { text } } = await worker.recognize(imageUrl);
      setOcrResult(text);
      setItems(parseReceiptText(text));
      setStep(2);
      setLoading(false);
      await worker.terminate();
    } catch (err) {
      setOcrError("OCR failed: " + (err.message || err));
      setLoading(false);
    }
  }

  // Step 3: User reviews item list, can edit/add/remove
  function updateItem(idx, key, value) {
    setItems(old =>
      old.map((it, i) => i === idx ? { ...it, [key]: value } : it)
    );
  }
  function removeItem(idx) {
    setItems(old => old.filter((_, i) => i !== idx));
    setSplitAlloc(old => old.filter((_, i) => i !== idx));
  }
  function addNewItem() {
    setItems(old => [...old, { name: "", price: 0 }]);
    setSplitAlloc(old => [...old, { memberIds: members.map(m => m.id), splitType:"equal", customSplits: {} }]);
  }

  // Step 4: Assign each item to group members (equal or custom split)
  function setSplitFor(idx, field, val) {
    setSplitAlloc(old =>
      old.map((s, i) => i === idx ? { ...s, [field]: val } : s)
    );
  }
  function setCustomSplit(idx, id, value) {
    setSplitAlloc(old =>
      old.map((s, i) =>
        i === idx
          ? {
              ...s,
              customSplits: { ...s.customSplits, [id]: value }
            }
          : s
      )
    );
  }

  // Step 5: Confirm & add expenses
  function handleConfirm() {
    if (!items.length) return;
    items.forEach((item, idx) => {
      // Determine assigned members
      const alloc = splitAlloc[idx] || {};
      const memberIds = alloc.memberIds || members.map(m => m.id);
      const splitType = alloc.splitType || "equal";
      let perMember = [];
      let customValid = true;
      if (splitType === "custom" && alloc.customSplits) {
        let sum = 0;
        memberIds.forEach(id => {
          const val = parseFloat(alloc.customSplits[id] || 0);
          if (isNaN(val) || val < 0) customValid = false;
          sum += val;
          perMember.push({ id, share: val });
        });
        // Snap to total if slightly off
        if (Math.abs(sum - Number(item.price)) > 0.02 * memberIds.length) customValid = false;
        // If invalid, fallback to equal
        if (!customValid) {
          perMember = memberIds.map(id => ({ id, share: Number(item.price) / memberIds.length }));
        }
      } else {
        perMember = memberIds.map(id => ({ id, share: Number(item.price) / memberIds.length }));
      }
      // For SplitQuest, add each item as an expense for the group, note payer = currentUserId
      addExpense(groupId, {
        title: item.name || "Scanned Item",
        amount: Number(item.price),
        date: new Date().toISOString().slice(0,10),
        payer: currentUserId,
        splitWith: memberIds
      });
    });
    setStep(3);
    if (onDone) onDone();
  }

  // --- Render UI ---
  // Steps: [0:upload] → [1:OCR] → [2:review] → [3:done]
  return (
    <div style={{
      background: "#f8f9fa", borderRadius: 13, padding: "2rem",
      margin: "2rem 0", boxShadow: "0 2px 14px #4f8a8b1a", maxWidth: 520
    }}>
      <h2>
        Receipt Scanner <span role="img" aria-label="Scanner">📷</span>
      </h2>
      {step === 0 && (
        <>
          <p>Upload a bill or receipt image for OCR recognition:</p>
          <input type="file" accept="image/*" onChange={handleFile} />
        </>
      )}
      {step === 1 && (
        <div style={{textAlign:"center"}}>
          <div>
            <img src={imageUrl} alt="Uploaded Receipt" style={{maxWidth:320, borderRadius:10, margin:"1rem 0"}} />
          </div>
          <button className="theme-toggle" disabled={loading} onClick={runOcr}>
            {loading ? "Processing..." : "Scan with OCR"}
          </button>
          {ocrError && <div style={{color:"#FF5959",marginTop:10}}>
            OCR error: {ocrError}
            <br />
            <small>(Mock output will be used if OCR library is unavailable.)</small>
          </div>}
        </div>
      )}
      {step === 2 && (
        <>
          <h4>Receipt Items &amp; Assignment</h4>
          <div style={{maxHeight:200,overflowY:"auto",background:"#fff",borderRadius:8,padding: "1rem",marginBottom:16,boxShadow:"0 1px 6px #4f8a8b14"}}>
            {items.map((item, idx) => (
              <div key={idx} style={{display:"flex",alignItems:"center", marginBottom:6}}>
                <input
                  style={{marginRight:8,width:110}}
                  value={item.name}
                  onChange={e=>updateItem(idx,"name",e.target.value)}
                  placeholder="Item"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  style={{marginRight:8,width:60}}
                  value={item.price}
                  onChange={e=>updateItem(idx,"price",e.target.value)}
                  placeholder="Price"
                />
                <button className="theme-toggle" style={{fontSize:12,marginRight:8,padding:"3px 12px"}} onClick={()=>removeItem(idx)}>-</button>
                {/* Split allocation UI */}
                <div>
                  <select
                    value={splitAlloc[idx]?.splitType || "equal"}
                    onChange={e => setSplitFor(idx, "splitType", e.target.value)}
                  >
                    <option value="equal">Equal split</option>
                    <option value="custom">Custom</option>
                  </select>
                  <span style={{marginLeft: 6, marginRight: 4}}>with</span>
                  <select
                    multiple
                    value={splitAlloc[idx]?.memberIds || members.map(m=>m.id)}
                    onChange={e =>
                      setSplitFor(idx, "memberIds",
                        Array.from(e.target.selectedOptions, opt => opt.value)
                      )
                    }
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                {splitAlloc[idx]?.splitType === "custom" && (
                  <div style={{display:"flex",flexDirection:"column",marginLeft:8}}>
                    {((splitAlloc[idx]?.memberIds)||members.map(m=>m.id)).map(uid => (
                      <div key={uid} style={{fontSize:"0.95em",display:"flex",alignItems:"center"}}>
                        <span style={{marginRight:4}}>{members.find(m=>m.id===uid)?.name}:</span>
                        <input type="number" min={0} step="0.01" style={{width:40}}
                          value={splitAlloc[idx]?.customSplits?.[uid] || ""}
                          onChange={e=>setCustomSplit(idx, uid, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button className="theme-toggle" onClick={addNewItem} style={{marginTop:8}}>+ Add Item</button>
          </div>
          <button className="theme-toggle" style={{marginTop:8}} onClick={handleConfirm}>
            Confirm &amp; Add Expenses
          </button>
        </>
      )}
      {step === 3 && (
        <div style={{textAlign:"center",padding:"2rem 0"}}>
          <div style={{fontSize:"2rem"}}>✅</div>
          Expense(s) added to group! <br/>
          <button className="theme-toggle" style={{marginTop:"1.2rem"}} onClick={onDone}>Close</button>
        </div>
      )}
      <div style={{marginTop:"1.5rem",color:"#888"}}>
        <b>Note:</b> OCR runs in-browser using Tesseract.js. If the library is not installed, a mock result is used.
      </div>
    </div>
  );
}
