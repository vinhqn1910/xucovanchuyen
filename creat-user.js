// creat-user.js
import { firebaseConfig } from './firebase-config.js';

// Firebase initialization
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Hàm định dạng thời gian
function formatDateTime(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

// Handle form submission
document.getElementById("create-account-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get input values
  const name = document.getElementById("name").value;
  const username = document.getElementById("username").value.trim(); // Loại bỏ khoảng trắng thừa
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {
    // Kiểm tra username trùng lặp
    const docRef = await db.collection("employees").doc(username).get();
    if (docRef.exists) {
      throw new Error("Username đã tồn tại. Vui lòng chọn username khác.");
    }

    // Tạo tài khoản trong Firebase Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;

    // Định dạng thời gian tạo
    const createdAt = formatDateTime(new Date());

    // Lưu thông tin vào Firestore với username là document ID
    await db.collection("employees").doc(username).set({
      userId,
      name,
      username,
      phone,
      email,
      role,
      isActive: "Đang hoạt động", // Sử dụng chuỗi thay vì boolean
      createdAt, // Thời gian tạo định dạng DD/MM/YYYY hh:mm:ss
    });

    document.getElementById("message").textContent = "Tài khoản đã được tạo thành công!";
    document.getElementById("message").style.color = "green";

    // Reset form
    document.getElementById("create-account-form").reset();
  } catch (error) {
    document.getElementById("message").textContent = `Lỗi: ${error.message}`;
    document.getElementById("message").style.color = "red";
  }
});
