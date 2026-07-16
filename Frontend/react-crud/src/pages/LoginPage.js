import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logoMicrotechnique from "../logo.png";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
    } catch (err) {
      // toast handled in AuthContext
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: "absolute", top: "5%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.35) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.25) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div className="login-layout">
        <div className="fade-in login-branding" style={{ color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <img src={logoMicrotechnique} alt="Microtechnique Logo" style={{ width: 42, height: 42, objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Microtechnique Payroll</span>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(167,243,208,.15)", border: "1px solid rgba(167,243,208,.3)", borderRadius: 99, padding: "5px 14px", marginBottom: 24 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#6EE7B7" }}>verified_user</span>
            <span style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 600 }}>Unified Workspace Access</span>
          </div>

          <h1 className="login-hero-heading">
            Sign in to<br />
            <span style={{ color: "#A5B4FC" }}>your<br />Workspace.</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.65)", maxWidth: 400, marginBottom: 40, lineHeight: 1.6 }}>
            Access all your payroll, HR, and project management tools in one place. Your role will be determined automatically.
          </p>
        </div>

        <div className="login-card fade-in" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, background: "var(--primary-50)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 30, color: "var(--primary-600)" }}>login</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)", marginBottom: 8 }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: "var(--gray-500)" }}>Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address <span className="form-label-required" />
              </label>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", fontSize: 18 }}>alternate_email</span>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                  placeholder="you@company.com"
                  style={{ paddingLeft: 40 }}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && <span className="form-error"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="form-label-required" />
              </label>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", fontSize: 18 }}>key</span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className={`form-input ${errors.password ? "input-error" : ""}`}
                  placeholder="••••••••"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)} className="icon-btn" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }} aria-label={showPass ? "Hide password" : "Show password"}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {errors.password && <span className="form-error"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>{errors.password.message}</span>}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <span onClick={() => navigate("/forgot-password")} style={{ fontSize: 12, color: "var(--primary-600)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                  Forgot Password?
                </span>
              </div>
            </div>

            <button
              id="login-submit-btn"
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ justifyContent: "center", padding: "13px", fontSize: 15, background: "var(--primary-600)", border: "none" }}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? <><div className="spinner" />Authenticating...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>Sign In</>
              }
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--gray-500)" }}>Don't have an account? </span>
            <button type="button" onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "var(--primary-600)", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
