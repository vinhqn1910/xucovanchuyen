import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { query, where, getDocs, collection, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM elements
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Kiểm tra trạng thái đăng nhập khi tải lại trang
if (localStorage.getItem("userLoggedIn") === "true") {
  loginForm.style.display = "none";
  logoutBtn.style.display = "block";
} else {
  loginForm.style.display = "block";
  logoutBtn.style.display = "none";
}

// Lắng nghe trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    

    try {
      // Truy vấn Firestore để tìm tài liệu của người dùng bằng userId
      const usersRef = collection(db, "employees"); // Đảm bảo đúng collection
      const q = query(usersRef, where("userId", "==", user.uid)); // Truy vấn theo userId
      const querySnapshot = await getDocs(q);

      // Nếu tìm thấy tài liệu, cập nhật trạng thái và thời gian đăng nhập
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, "employees", userDoc.id); // Lấy ID tài liệu người dùng
        await updateDoc(userRef, {
          status: "online", // Cập nhật trạng thái là online
          lastLogin: Timestamp.now() // Cập nhật thời gian đăng nhập
        });
      }

      // Lưu trạng thái đăng nhập vào localStorage
      localStorage.setItem("userLoggedIn", "true");

      // Ẩn form đăng nhập và hiển thị thông tin người dùng đã đăng nhập
      userInfo.textContent = `Logged in as: ${user.email}`;
      loginForm.style.display = "none";
      logoutBtn.style.display = "block";
    } catch (error) {
      console.error("Error updating user status:", error);
    }
    window.location.href = "/homepage.html"; // Chuyển hướng đến trang đăng nhập
  } else {
    console.log("No user is logged in");
    // Khi không đăng nhập, hiển thị form đăng nhập
    userInfo.textContent = "Not logged in";
    loginForm.style.display = "block";
    logoutBtn.style.display = "none";

    // Xóa trạng thái đăng nhập khỏi localStorage
    localStorage.setItem("userLoggedIn", "false");
  }
});

// Xử lý đăng nhập
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Logged in:", userCredential.user);
      
    })
    .catch((error) => {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
    });
});

// Xử lý đăng xuất
logoutBtn.addEventListener("click", async () => {
  const user = auth.currentUser;

  if (user) {
    try {
      // Truy vấn Firestore để tìm tài liệu của người dùng bằng userId
      const usersRef = collection(db, "employees"); // Đảm bảo đúng collection
      const q = query(usersRef, where("userId", "==", user.uid)); // Truy vấn theo userId
      const querySnapshot = await getDocs(q);

      // Nếu tìm thấy tài liệu, cập nhật trạng thái thành 'offline'
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, "employees", userDoc.id); // Lấy ID tài liệu người dùng
        await updateDoc(userRef, {
          status: "offline" // Cập nhật trạng thái là offline
        });
      }
    } catch (error) {
      console.error("Error updating status during logout:", error);
    }
  }

  // Đăng xuất người dùng
  signOut(auth)
    .then(() => {
      console.log("User logged out");

      // Xóa trạng thái đăng nhập khỏi localStorage
      localStorage.setItem("userLoggedIn", "false");
    })
    .catch((error) => {
      console.error("Logout failed:", error.message);
    });
});
