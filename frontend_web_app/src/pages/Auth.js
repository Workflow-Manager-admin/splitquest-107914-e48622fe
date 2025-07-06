import React, { useState } from 'react';

// PUBLIC_INTERFACE
export default function Auth() {
  /**
   * Authentication/Onboarding UI: login and register view (UI stub).
   */
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="App" style={{
      display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"
    }}>
      <div style={{
        background:"var(--background-light,#fff)",
        borderRadius:"18px",
        boxShadow:"0 2px 18px #4f8a8b23",
        width:"350px",padding:"2.5rem"
      }}>
        <h2 style={{color: 'var(--color-primary,#4F8A8B)',marginBottom:14}}>
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <form>
          {!isLogin && (
            <input type="text" placeholder="Name" style={{marginBottom:10,width:"100%"}} />
          )}
          <input type="email" placeholder="Email" style={{marginBottom:10,width:"100%"}} />
          <input type="password" placeholder="Password" style={{marginBottom:10,width:"100%"}} />
          <button
            className="theme-toggle"
            style={{width:"100%",marginBottom:14}}
            type="submit"
            disabled
            title="Stub only"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div style={{marginTop:8,fontSize:"0.95rem"}}>
          {isLogin ? (
            <>No account? <button className="App-link" style={{border:"none",background:"none",color:"var(--color-accent,#FF5959)",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setIsLogin(false)}><b>Sign up</b></button></>
          ) : (
            <>Already have an account? <button className="App-link" style={{border:"none",background:"none",color:"var(--color-accent,#FF5959)",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setIsLogin(true)}><b>Login</b></button></>
          )}
        </div>
      </div>
    </div>
  );
}
