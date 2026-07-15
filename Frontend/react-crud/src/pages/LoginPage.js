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

const ROLES = [
  {
    key: "SuperAdmin",
    label: "Super Admin",
    icon: "admin_panel_settings",
    color: "#7C3AED",
    bg: "#EDE9FE",
    desc: "Platform-level control over all companies and admins",
    badge: "Highest Privilege",
  },
  {
    key: "Admin",
    label: "Admin",
    icon: "manage_accounts",
    color: "#4F46E5",
    bg: "#EEF2FF",
    desc: "Full company management — payroll, employees and spaces",
    badge: "Company Owner",
  },
  {
    key: "Manager",
    label: "Manager",
    icon: "supervisor_account",
    color: "#0891B2",
    bg: "#E0F2FE",
    desc: "Team oversight — leaves, worklogs and attendance",
    badge: "Team Manager",
  },
  {
    key: "TeamLead",
    label: "Team Lead",
    icon: "groups",
    color: "#059669",
    bg: "#D1FAE5",
    desc: "Task management, team monitoring and work reviews",
    badge: "Team Lead",
  },
  {
    key: "Employee",
    label: "Employee",
    icon: "badge",
    color: "#D97706",
    bg: "#FEF3C7",
    desc: "View payslips, apply leaves and submit work logs",
    badge: "Employee",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hovered, setHovered] = useState(null);

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

  const roleInfo = ROLES.find((r) => r.key === selectedRole);

  // ROLE SELECTOR SCREEN
  if (!selectedRole) {
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
              <span style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 600 }}>ISO 27001 Certified Enterprise Platform</span>
            </div>

            <h1 className="login-hero-heading">
              Who are<br />
              <span style={{ color: "#A5B4FC" }}>you logging<br />in as?</span>
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.65)", maxWidth: 400, marginBottom: 40, lineHeight: 1.6 }}>
              Select your role to access the right workspace. Each role has a tailored experience built for your responsibilities.
            </p>

            <div style={{ display: "flex", gap: 32, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.1)" }}>
              {[{ v: "5", l: "Access Roles" }, { v: "99.9%", l: "Uptime" }, { v: "150+", l: "Companies" }].map((s) => (
                <div key={s.l}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="login-card fade-in" style={{ maxWidth: 480 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, background: "var(--primary-50)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--primary-500)" }}>person_search</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)", marginBottom: 4 }}>Select Your Role</h2>
              <p style={{ fontSize: 13, color: "var(--gray-500)" }}>Choose the role that matches your position</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  id={`role-btn-${role.key}`}
                  onClick={() => setSelectedRole(role.key)}
                  onMouseEnter={() => setHovered(role.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `2px solid ${hovered === role.key ? role.color : "var(--gray-200)"}`,
                    background: hovered === role.key ? role.bg : "#fff",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    textAlign: "left",
                    transform: hovered === role.key ? "translateX(4px)" : "none",
                    boxShadow: hovered === role.key ? `0 4px 16px ${role.color}22` : "none",
                    width: "100%",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: role.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: role.color }}>{role.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)", marginBottom: 2 }}>{role.label}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.4 }}>{role.desc}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: role.color, background: role.bg, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", border: `1px solid ${role.color}33` }}>{role.badge}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: hovered === role.key ? role.color : "var(--gray-300)" }}>arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN FORM SCREEN
  return (
    <div className="login-page">
      <div style={{ position: "absolute", top: "5%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${roleInfo.color}55 0%, transparent 70%)`, filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${roleInfo.color}33 0%, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />

      <div className="login-layout">
        <div className="fade-in login-branding" style={{ color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <img src={logoMicrotechnique} alt="Microtechnique Logo" style={{ width: 42, height: 42, objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em" }}>Microtechnique Payroll</span>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 99, padding: "8px 18px", marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: roleInfo.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: roleInfo.color }}>{roleInfo.icon}</span>
            </div>
            <span style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>Signing in as {roleInfo.label}</span>
          </div>

          <h1 className="login-hero-heading">
            Welcome<br />
            <span style={{ color: "#A5B4FC" }}>Back,<br />{roleInfo.label}.</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", maxWidth: 380, marginBottom: 36, lineHeight: 1.7 }}>
            {roleInfo.desc}. Enter your credentials to access your workspace.
          </p>

          <button
            type="button"
            id="change-role-btn"
            onClick={() => setSelectedRole(null)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Change Role
          </button>
        </div>

        <div className="login-card fade-in">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, background: roleInfo.bg, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 6px 20px ${roleInfo.color}33` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 30, color: roleInfo.color }}>{roleInfo.icon}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)", marginBottom: 8 }}>Sign In</h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: roleInfo.color, background: roleInfo.bg, padding: "4px 12px", borderRadius: 99, border: `1px solid ${roleInfo.color}33` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{roleInfo.icon}</span>
              {roleInfo.badge}
            </span>
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
              style={{ justifyContent: "center", padding: "13px", fontSize: 15, background: roleInfo.color, border: "none" }}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? <><div className="spinner" />Authenticating...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>Sign In as {roleInfo.label}</>
              }
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--gray-500)" }}>Don't have an account? </span>
            <button type="button" onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: roleInfo.color, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Create account
            </button>
          </div>

          <div style={{ marginTop: 16, background: roleInfo.bg, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8, border: `1px solid ${roleInfo.color}22` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: roleInfo.color, marginTop: 1 }}>info</span>
            <p style={{ fontSize: 12, color: "var(--gray-600)", lineHeight: 1.5 }}>
              Signing in as <strong>{roleInfo.label}</strong>. {roleInfo.desc}.{" "}
              <span onClick={() => setSelectedRole(null)} style={{ color: roleInfo.color, fontWeight: 600, cursor: "pointer" }}>Switch role</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
