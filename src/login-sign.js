import { supabase } from "../supabase.js";

const $ = (selector) => document.querySelector(selector);

const title = $("#account-title");
const intro = $("#account-intro");

const tabs = {
  login: $("#login-tab"),
  signup: $("#signup-tab"),
};

const forms = {
  login: $("#login-form"),
  signup: $("#signup-form"),
};

function showNotice(form, message, success = false) {
  const notice = form.querySelector(".notice");

  notice.textContent = message;
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.style.color = success ? "#15803d" : "#b91c1c";
}

function setBusy(form, busy, label) {
  const button = form.querySelector('button[type="submit"]');

  if (!button) return;

  if (!button.dataset.normalLabel) {
    button.dataset.normalLabel = button.textContent.trim();
  }

  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
  button.textContent = busy ? label : button.dataset.normalLabel;
}

function showForm(view, updateHistory = true) {
  const isSignup = view === "signup";

  tabs.login.setAttribute("aria-selected", String(!isSignup));
  tabs.signup.setAttribute("aria-selected", String(isSignup));

  forms.login.hidden = isSignup;
  forms.signup.hidden = !isSignup;

  title.textContent = isSignup
    ? "Create your account"
    : "Welcome back";

  intro.textContent = isSignup
    ? "Sign up to get started."
    : "Log in to your account.";

  Object.values(forms).forEach((form) => {
    const notice = form.querySelector(".notice");
    if (notice) notice.textContent = "";
  });

  if (updateHistory) {
    history.replaceState(
      null,
      "",
      isSignup ? "#signup" : "#login"
    );
  }
}

tabs.login.addEventListener("click", () => showForm("login"));
tabs.signup.addEventListener("click", () => showForm("signup"));

forms.login.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = forms.login;
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;

  if (!email || !password) {
    showNotice(form, "Enter your email and password.");
    return;
  }

  setBusy(form, true, "Logging in…");

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    showNotice(form, "Login successful. Opening your dashboard…", true);
    window.location.assign("./dashboard.html");
  } catch (error) {
    console.error("Supabase login error:", error);

    showNotice(
      form,
      "Unable to log in with those details. Check your email and password, then try again."
    );
  } finally {
    setBusy(form, false);
  }
});

forms.signup.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = forms.signup;
  const fullName = $("#signup-name").value.trim();
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;

  if (!fullName) {
    showNotice(form, "Enter your full name.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotice(form, "Enter a valid email address.");
    return;
  }

  if (password.length < 8) {
    showNotice(form, "Use a password with at least 8 characters.");
    return;
  }

  setBusy(form, true, "Creating account…");

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
      showNotice(form, "Account created. Opening your dashboard…", true);
      window.location.assign("./dashboard.html");
    } else {
      showNotice(
        form,
        "Account created. Check your email to confirm your address, then log in.",
        true
      );
    }
  } catch (error) {
    console.error("Supabase sign-up error:", error);

    showNotice(
      form,
      error?.message || "We couldn't create your account. Please try again."
    );
  } finally {
    setBusy(form, false);
  }
});

showForm(
  window.location.hash === "#signup" ? "signup" : "login",
  false
);