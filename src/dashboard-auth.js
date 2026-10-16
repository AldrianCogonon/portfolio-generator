import { supabase } from "../supabase.js";

const signOutButton = document.querySelector("#sign-out-button");

async function requireSignedInUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.replace("./login-sign.html#login");
      return;
    }

    const user = data.user;
    const fullName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Creator";

    const name = document.querySelector("#profile-name");
    const welcome = document.querySelector("#welcome-name");
    const avatar = document.querySelector("#profile-avatar");

    if (name) name.textContent = fullName;
    if (welcome) welcome.textContent = `, ${fullName}`;
    if (avatar) {
      avatar.textContent = fullName.charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("Unable to verify the current session:", error);
    window.location.replace("./login-sign.html#login");
  }
}

signOutButton?.addEventListener("click", async () => {
  signOutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    window.location.replace("./index.html");
  } catch (error) {
    console.error("Sign-out error:", error);
    signOutButton.disabled = false;
    alert("We couldn't sign you out. Please try again.");
  }
});

await requireSignedInUser();