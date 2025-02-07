import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { query, where, getDocs, collection, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const logoutBtn = document.getElementById("logout-btn");

// Kiểm tra trạng thái đăng nhập khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Truy vấn Firestore để tìm tài liệu của người dùng
        const usersRef = collection(db, "employees");
        const q = query(usersRef, where("userId", "==", user.uid)); // Truy vấn theo userId
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userRef = doc(db, "employees", userDoc.id);

          // Lấy thông tin username, name, và role từ tài liệu Firestore
          const username = userDoc.data().username;
          const name = userDoc.data().name;
          const userRole = userDoc.data().role; // Thêm role

          // Hiển thị thông tin chào mừng
          const welcomeMessageElement = document.getElementById("welcome-message");
          if (welcomeMessageElement) {
            welcomeMessageElement.textContent = `Chào Mừng ${username} - ${name}`;
            console.log("Welcome message updated");
          }

          // Lưu thông tin người dùng vào localStorage
          localStorage.setItem("username", username);
          localStorage.setItem("name", name);
          localStorage.setItem("userRole", userRole);

          // Cập nhật trạng thái online và thời gian hoạt động cuối cùng
          await updateDoc(userRef, {
            status: "online",
            lastActive: Timestamp.now(),
          });

          // Cập nhật menu theo quyền
          restrictAccess(userRole);
        } else {
          console.error("User document not found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching user data or updating status:", error);
      }

      // Xử lý đăng xuất khi nhấn nút logout
      logoutBtn.addEventListener("click", async () => {
        const confirmLogout = confirm("Bạn có muốn đăng xuất không?");
        if (!confirmLogout) return;

        try {
          const q = query(collection(db, "employees"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userRef = doc(db, "employees", userDoc.id);
            await updateDoc(userRef, {
              status: "offline",
              lastActive: Timestamp.now(),
            });
          }
        } catch (error) {
          console.error("Error updating status during logout:", error);
        }

        // Đăng xuất người dùng
        signOut(auth)
          .then(() => {
            console.log("User logged out");
            localStorage.removeItem("userLoggedIn");
            window.location.href = "index.html"; // Chuyển hướng về trang index
          })
          .catch((error) => {
            console.error("Logout failed:", error.message);
          });
      });

      // Lắng nghe sự kiện tắt trình duyệt hoặc tab
      window.addEventListener("beforeunload", async () => {
        if (auth.currentUser) {
          try {
            const q = query(collection(db, "employees"), where("userId", "==", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userRef = doc(db, "employees", userDoc.id);

              // Cập nhật trạng thái thành offline
              await updateDoc(userRef, {
                status: "offline",
                lastActive: Timestamp.now(),
              });
            }
          } catch (error) {
            console.error("Error updating status during browser close:", error);
          }
        }
      });
    } else {
      // Nếu người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
      alert("Please log in first.");
      window.location.href = "index.html";
    }
  });
});

// Hàm xử lý quyền truy cập menu dựa trên vai trò người dùng
function restrictAccess(userRole) {
  const allowedPages = {
    "Nhân viên": ["menu-homepage", "menu-newticket", "menu-formsc", "menu-ticket-management", "menu-money-management", "menu-form-xu-ly"],
    // Không cần liệt kê menu cho "admin"
  };

  // Hiển thị menu tùy thuộc vào quyền của người dùng
  if (userRole === "admin") {
    // Admin có thể truy cập tất cả menu
    document.querySelectorAll(".menu a").forEach((menuItem) => {
      menuItem.style.display = "block";
    });
  } else if (allowedPages[userRole]) {
    // Nhân viên chỉ có quyền truy cập vào các menu được chỉ định
    document.querySelectorAll(".menu a").forEach((menuItem) => {
      menuItem.style.display = "none";  // Ẩn tất cả menu trước
    });

    allowedPages[userRole].forEach(menuId => {
      const menuItem = document.getElementById(menuId);
      if (menuItem) {
        menuItem.style.display = "block";  // Hiển thị các menu được phép
      }
    });
  } else {
    // Nếu không có quyền hợp lệ
    alert("Lỗi: Quyền của tài khoản không hợp lệ. Vui lòng liên hệ Vĩnh.");
    window.location.href = "index.html";
  }

  // Kiểm tra quyền truy cập vào trang hiện tại
  const currentPage = window.location.pathname.split("/").pop();
  const allowedUrls = allowedPages[userRole]?.map(menuId => document.getElementById(menuId)?.getAttribute("href")) || [];

  if (userRole === "admin") {
    return;  // Admin có thể vào tất cả trang
  }

  if (!allowedUrls.includes(currentPage)) {
    alert("Bạn không có quyền truy cập trang này. Vui lòng liên hệ Thành Vĩnh, Dương Duy.");
    window.location.href = "homepage.html";
  }
}
