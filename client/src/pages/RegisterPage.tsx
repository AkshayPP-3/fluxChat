import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const css = (s: CSSProperties): CSSProperties => s;

function BubbleBackground() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .nc-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(99,102,241,0.22);
          border-radius: 12px;
          padding: 11px 15px;
          font-size: 13px;
          color: #e0e7ff;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border 0.18s, background 0.18s, box-shadow 0.18s;
          caret-color: #818cf8;
          display: block;
        }
        .nc-input::placeholder { color: rgba(148,163,184,0.32); }
        .nc-input:focus {
          border-color: rgba(129,140,248,0.65);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .nc-input-pr { padding-right: 42px; }

        .nc-eye {
          background: none; border: none; cursor: pointer;
          color: rgba(129,140,248,0.55);
          display: flex; align-items: center;
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          padding: 2px; transition: color 0.15s;
        }
        .nc-eye:hover { color: #818cf8; }

        .nc-tab {
          flex: 1; padding: 8px; border-radius: 10px; border: none;
          cursor: pointer; font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          background: transparent; color: rgba(148,163,184,0.5);
        }
        .nc-tab-active {
          background: linear-gradient(135deg, #6366f1, #818cf8) !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }

        .nc-submit {
          width: 100%; padding: 13px; border-radius: 14px; border: none;
          cursor: pointer; font-size: 13px; font-weight: 700;
          letter-spacing: 0.04em; font-family: 'DM Sans', sans-serif;
          color: #fff;
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #06b6d4 100%);
          box-shadow: 0 4px 20px rgba(99,102,241,0.42);
          transition: all 0.18s;
        }
        .nc-submit:hover { box-shadow: 0 6px 28px rgba(99,102,241,0.58); transform: translateY(-1px); }
        .nc-submit:active { transform: translateY(0); }

        .nc-alt-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px; border-radius: 12px;
          border: 1px solid rgba(99,102,241,0.17);
          background: rgba(255,255,255,0.04);
          cursor: pointer; font-size: 12px; font-weight: 600;
          color: rgba(199,210,254,0.65); font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .nc-alt-btn:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(129,140,248,0.38);
          color: #c7d2fe;
        }

        .nc-forgot {
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; color: #818cf8;
          font-family: 'DM Sans', sans-serif;
        }
        .nc-forgot:hover { color: #a5b4fc; }

        .nc-switch {
          background: none; border: none; cursor: pointer;
          font-weight: 600; color: #818cf8;
          font-family: 'DM Sans', sans-serif; font-size: 12px;
        }
        .nc-switch:hover { color: #a5b4fc; }

        @media (max-width: 480px) {
          .nc-card-responsive {
            max-width: 100% !important;
            border-radius: 0 !important;
            border: none !important;
            background: transparent !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
            padding: 20px !important;
          }
          .nc-mobile-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .nc-seg {
          height: 2px; flex: 1; border-radius: 2px;
          background: rgba(99,102,241,0.12);
          transition: background 0.2s;
        }

        @keyframes floatA {
          0%,100% { transform: translateY(0) scale(1); }
          33%      { transform: translateY(-26px) scale(1.04); }
          66%      { transform: translateY(14px) scale(0.97); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0) scale(1); }
          40%     { transform: translateY(22px) scale(1.03); }
          70%     { transform: translateY(-16px) scale(0.98); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={css({ position:"absolute", width:460, height:460, top:"-10%", left:"-12%", borderRadius:"50%", background:"radial-gradient(circle,#6366f1,#818cf8)", opacity:0.18, filter:"blur(80px)", animation:"floatA 14s ease-in-out infinite", pointerEvents:"none" })} />
      <div style={css({ position:"absolute", width:340, height:340, bottom:"-8%", right:"-10%", borderRadius:"50%", background:"radial-gradient(circle,#06b6d4,#3b82f6)", opacity:0.14, filter:"blur(80px)", animation:"floatB 18s ease-in-out infinite", pointerEvents:"none" })} />
      <div style={css({ position:"absolute", width:200, height:200, top:"55%", left:"62%", borderRadius:"50%", background:"radial-gradient(circle,#a78bfa,#6366f1)", opacity:0.1, filter:"blur(70px)", animation:"floatA 22s ease-in-out infinite reverse", pointerEvents:"none" })} />
    </>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  isPassword?: boolean;
  showPass?: boolean;
  onTogglePass?: () => void;
}

function Field({ label, placeholder, type = "text", value, onChange, isPassword, showPass, onTogglePass }: FieldProps) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(199,210,254,0.65)", fontFamily:"'DM Sans',sans-serif" }}>
        {label}
      </label>
      <div style={{ position:"relative" }}>
        <input
          className={`nc-input${isPassword ? " nc-input-pr" : ""}`}
          type={isPassword ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
        />
        {isPassword && (
          <button className="nc-eye" type="button" onClick={onTogglePass} aria-label="toggle password visibility">
            <EyeIcon open={!!showPass} />
          </button>
        )}
      </div>
    </div>
  );
}


export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "",
    password: "", confirmPassword: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.username || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: form.firstName,
          lastname: form.lastName,
          username: form.username,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Automatically login after register
      login(data.user, data.token);
      navigate("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password; let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthColor = ["#ef4444","#f97316","#eab308","#22c55e"];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b0d14",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "2rem 1rem",
    }}>
      <BubbleBackground />

      <div className="nc-card-responsive" style={{
        position: "relative",
        width: "100%",
        maxWidth: 440,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 28,
        padding: 32,
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)",
        animation: "fadeUp 0.5s cubic-bezier(.22,1,.36,1) both",
      }}>

        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"66%", height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.6),transparent)" }} />

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <div style={{ width:48, height:48, background:"linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24">
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V8h12v4z" />
            </svg>
          </div>
          <div className="nc-mobile-grid" style={{ marginTop:10, fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#e0e7ff", letterSpacing:"-0.01em" }}>
            FluxChat
          </div>
          <div style={{ marginTop:4, fontSize:13, color:"rgba(148,163,184,0.6)" }}>
            Join FluxChat and start messaging
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "8px" }}>
              {error}
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Field label="First Name" placeholder="First Name"   value={form.firstName} onChange={set("firstName")} />
            <Field label="Last Name"  placeholder="Last Name" value={form.lastName}  onChange={set("lastName")} />
          </div>

          <Field label="Username" placeholder="Username" value={form.username} onChange={set("username")} />

          <Field
            label="Password" placeholder="Password"
            value={form.password} onChange={set("password")}
            isPassword showPass={showPass} onTogglePass={() => setShowPass(v => !v)}
          />

          <div style={{ display:"flex", gap:3, marginTop:-8 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="nc-seg" style={{ background: i <= strength ? strengthColor[strength - 1] : undefined }} />
            ))}
          </div>

          <Field
            label="Confirm Password" placeholder="Confirm Password"
            value={form.confirmPassword} onChange={set("confirmPassword")}
            isPassword showPass={showConfirm} onTogglePass={() => setShowConfirm(v => !v)}
          />

          <button className="nc-submit" style={{ marginTop:4 }} type="button" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
    
        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:"rgba(148,163,184,0.42)" }}>
          Already have an account?{" "}
          <button className="nc-switch" type="button" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
