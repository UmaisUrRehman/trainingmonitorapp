
  document.addEventListener("DOMContentLoaded", function () {
    const sessionId = localStorage.getItem("session_id");
    
    const div1 = document.getElementById("div1");
    const div2 = document.getElementById("div2");

    if (sessionId && /^[A-Za-z0-9]{6}$/.test(sessionId)) {
      // Session exists → show div2, hide div1
      div2.style.display = "block";
      div1.style.display = "none";
    } else {
      // No session → show div1, hide div2
      div1.style.display = "block";
      div2.style.display = "none";
    }
  });
