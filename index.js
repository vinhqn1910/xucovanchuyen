import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";  
import { firebaseConfig } from './firebase-config.js';

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Lắng nghe trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Nếu chưa đăng nhập, điều hướng về trang đăng nhập
        window.location.href = "index.html";
    } else {
        try {
            // Truy xuất tài liệu người dùng từ Firestore
            const userRef = doc(db, "employees", user.uid);
            const userDoc = await getDoc(userRef);

            // Kiểm tra nếu tài liệu người dùng tồn tại
            if (userDoc.exists()) {
                const username = userDoc.data().username || "Người dùng";
                document.querySelector(".menu h3").textContent = `Chào mừng ${username}`;
            } else {
                // Nếu tài liệu không tồn tại, tạo tài liệu mặc định
                console.log("Không tìm thấy thông tin người dùng trong Firestore.");
                await setDoc(userRef, {
                    username: user.displayName || "Người dùng",  // Thêm username mặc định
                    email: user.email
                });
                document.querySelector(".menu h3").textContent = "Chào mừng Người dùng";
            }
        } catch (error) {
            console.error("Lỗi khi truy xuất dữ liệu người dùng từ Firestore:", error);
            document.querySelector(".menu h3").textContent = "Chào mừng Người dùng";
        }
        console.log("User ID:", user.uid);

    }
});

// Xử lý đăng xuất với popup
document.getElementById("logout-button").addEventListener("click", () => {
    document.getElementById("logout-popup").classList.remove("hidden");
});

// Xử lý xác nhận đăng xuất
document.getElementById("confirm-logout").addEventListener("click", async () => {
    try {
        await signOut(auth);
        alert("Đăng xuất thành công!");
        // Điều hướng về trang đăng nhập
        window.location.href = "index.html";
    } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
        alert("Đã xảy ra lỗi khi đăng xuất!");
    }
});

// Xử lý hủy đăng xuất
document.getElementById("cancel-logout").addEventListener("click", () => {
    document.getElementById("logout-popup").classList.add("hidden");
});
