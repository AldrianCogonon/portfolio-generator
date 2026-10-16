import { supabase } from "../supabase.js";

const form = document.querySelector("#reset-form");
const passwordInput = document.querySelector("#new-password");
const confirmInput = document.querySelector("#confirm-password");
const notice = document.querySelector("#reset-notice");
const button = form.querySelector('button[type="submit"]');

function showMessage(message, success = false) {
  notice.textContent = message;
  notice.style.color = success ? "#15803d" : "#b91c1c";
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    showMessage("Choose a new password for your account.", true);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = passwordInput.value;
  const confirmation = confirmInput.value;

  if (password.length < 8) {
    showMessage("Use a password with at least 8 characters.");
    return;
  }

  if (password !== confirmation) {
    showMessage("The passwords do not match.");
    return;
  }

  button.disabled = true;
  button.textContent = "Updating…";

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error(
        "This reset link may have expired. Request a new password-reset email."
      );
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;

    showMessage(
      "Your password has been updated. You can now log in.",
      true
    );

    form.reset();

    window.setTimeout(() => {
      window.location.assign("./login-sign.html#login");
    }, 1200);
  } catch (error) {
    console.error("Password update error:", error);
    showMessage(
      error?.message || "We couldn't update your password. Try again."
    );
  } finally {
    button.disabled = false;
    button.textContent = "Update password";
  }
});