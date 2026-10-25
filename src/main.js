import { getUser, login, logout, handleAuthCallback } from "@netlify/identity";

const $ = (id) => document.getElementById(id);
const show = (screen) => {
  for (const s of ["screen-loading", "screen-auth", "screen-app"]) $(s).hidden = s !== screen;
};

async function init() {
  $("year").textContent = new Date().getFullYear();
  try { await handleAuthCallback(); } catch {}
  const user = await getUser();
  if (user) {
    $("current-user").textContent = user.email ?? "";
    show("screen-app");
  } else show("screen-auth");
}

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    await login(f.get("email"), f.get("password"));
    location.reload();
  } catch {
    alert("Email atau kata sandi salah.");
  }
});

document.querySelector('[data-action="logout"]').addEventListener("click", async () => {
  await logout();
  location.reload();
});

init();
