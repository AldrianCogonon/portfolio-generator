import { supabase } from "../supabase.js";

/*
  The homepage is a public page, but it should still recognise a signed-in
  visitor. Without this, the header kept showing "Login" / "Sign In" and every
  call-to-action pointed back to the login page, so a user who returned from
  the dashboard looked (and felt) logged out even though the session was intact.

  This only reads the saved session. It never signs the user out by itself.
*/

async function applySignedInState() {
  let session = null;

  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session ?? null;
  } catch (error) {
    console.error("Unable to read the current session:", error);
    return;
  }

  if (!session) return;

  const logoutLink = document.getElementById("login");
  const dashboardLink = document.getElementById("sign-in");

  if (dashboardLink) {
    dashboardLink.textContent = "Dashboard";
    dashboardLink.setAttribute("href", "./dashboard.html");
  }

  if (logoutLink) {
    logoutLink.textContent = "Log out";
    logoutLink.setAttribute("href", "#");

    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Sign-out error:", error);
      }

      window.location.reload();
    });
  }

  // Remaining sign-up / login calls to action: signed-in users go straight to their dashboard.
  document.querySelectorAll('a[href*="login-sign.html"]').forEach((link) => {
    if (link !== logoutLink && link !== dashboardLink) {
      link.setAttribute("href", "./dashboard.html");
    }
  });
}

applySignedInState();