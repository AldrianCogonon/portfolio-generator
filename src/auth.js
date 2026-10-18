import { supabase } from "../supabase.js";

const $ = (id) => document.getElementById(id);

const modal = $("auth-modal");
const signupForm = $("signup-form");
const loginForm = $("login-form");
const tabSignup = $("tab-signup");
const tabLogin = $("tab-login");

if (
  modal &&
  signupForm &&
  loginForm &&
  tabSignup &&
  tabLogin
) {
  function showMessage(element, message, success = false) {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("hidden");
    element.className = success
      ? "text-sm text-green-600"
      : "text-sm text-red-600";
    element.setAttribute("role", "status");
  }

  function clearMessages() {
    [$("su-msg"), $("li-msg")].forEach((element) => {
      if (!element) return;
      element.textContent = "";
      element.classList.add("hidden");
    });
  }

  function setBusy(button, busy, busyLabel, normalLabel) {
    if (!button) return;

    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));

    const label = button.querySelector("span");
    if (label) {
      label.textContent = busy ? busyLabel : normalLabel;
    }
  }

  function switchTab(tab) {
    const isSignup = tab === "signup";

    signupForm.classList.toggle("hidden", !isSignup);
    loginForm.classList.toggle("hidden", isSignup);

    tabSignup.setAttribute("aria-selected", String(isSignup));
    tabLogin.setAttribute("aria-selected", String(!isSignup));

    tabSignup.classList.toggle("border-blue-600", isSignup);
    tabSignup.classList.toggle("font-semibold", isSignup);
    tabSignup.classList.toggle("text-slate-900", isSignup);
    tabSignup.classList.toggle("border-transparent", !isSignup);
    tabSignup.classList.toggle("text-slate-400", !isSignup);

    tabLogin.classList.toggle("border-blue-600", !isSignup);
    tabLogin.classList.toggle("font-semibold", !isSignup);
    tabLogin.classList.toggle("text-slate-900", !isSignup);
    tabLogin.classList.toggle("border-transparent", isSignup);
    tabLogin.classList.toggle("text-slate-400", isSignup);

    clearMessages();
  }

  function openAuth(tab = "signup") {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    switchTab(tab);
  }

  function closeAuth() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    clearMessages();
  }

  function goToDashboard() {
    window.location.assign("./dashboard.html");
  }

  tabSignup.addEventListener("click", () => switchTab("signup"));
  tabLogin.addEventListener("click", () => switchTab("login"));

  $("auth-close")?.addEventListener("click", closeAuth);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeAuth();
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeAuth();
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = $("su-msg");
    const button = $("su-submit");
    const fullName = $("su-name")?.value.trim() ?? "";
    const email = $("su-email")?.value.trim() ?? "";
    const password = $("su-password")?.value ?? "";

    if (!fullName) {
      showMessage(message, "Enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(message, "Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      showMessage(message, "Use a password with at least 8 characters.");
      return;
    }

    setBusy(button, true, "Creating account…", "Create free account");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard.html`,
        },
      });

      if (error) throw error;

      if (data.session) {
        showMessage(message, "Account created. Opening your dashboard…", true);
        window.setTimeout(goToDashboard, 700);
      } else {
        showMessage(
          message,
          "Account created. Check your email to confirm your address before logging in.",
          true
        );
      }
    } catch (error) {
      console.error("Supabase sign-up error:", error);
      const duplicate =
        error?.code === "user_already_exists" ||
        /already\s+(been\s+)?registered|already\s+exists/i.test(error?.message || "");

      showMessage(
        message,
        duplicate
          ? "Unable to complete registration. Please check your information or try logging in if you already have an account."
          : error?.message || "We couldn't create your account. Please try again."
      );
    } finally {
      setBusy(button, false, "Creating account…", "Create free account");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = $("li-msg");
    const button = $("li-submit");
    const email = $("li-email")?.value.trim() ?? "";
    const password = $("li-password")?.value ?? "";

    if (!email || !password) {
      showMessage(message, "Enter your email and password.");
      return;
    }

    setBusy(button, true, "Logging in…", "Log in");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showMessage(message, "Login successful. Opening your dashboard…", true);
      window.setTimeout(goToDashboard, 400);
    } catch (error) {
      console.error("Supabase login error:", error);

      showMessage(
        message,
        "Unable to log in with those details. Check your email and password, then try again."
      );
    } finally {
      setBusy(button, false, "Logging in…", "Log in");
    }
  });

  $("forgot-btn")?.addEventListener("click", async () => {
    const message = $("li-msg");
    const email = $("li-email")?.value.trim() ?? "";

    if (!email) {
      showMessage(message, "Enter your email address first.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`,
      });

      if (error) throw error;

      showMessage(
        message,
        "If an account exists for that address, a password-reset email will be sent.",
        true
      );
    } catch (error) {
      console.error("Password reset error:", error);
      showMessage(
        message,
        "We couldn't request a password reset. Please try again."
      );
    }
  });

  document.querySelectorAll("[data-auth]").forEach((button) => {
    button.addEventListener("click", () => {
      openAuth(button.dataset.auth);
    });
  });

  window.soyonAuthModal = { open: openAuth, close: closeAuth };
}