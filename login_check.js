import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Kiểm tra trạng thái đăng nhập khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");

  if (userRole && username && name) {
    // Nếu thông tin người dùng đã lưu trong localStorage, hiển thị thông tin chào mừng
    const welcomeMessageElement = document.getElementById("welcome-message");
    if (welcomeMessageElement) {
      welcomeMessageElement.textContent = `Chào Mừng ${username} - ${name}`;
      console.log("Welcome message updated from localStorage");
    } else {
      console.error("Element with id 'welcome-message' not found.");
    }
    restrictAccess(userRole);
    document.getElementById("menu").style.visibility = "visible";
  } else {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const usersRef = collection(db, "employees");
          const q = query(usersRef, where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);

          console.log("Query snapshot:", querySnapshot); // Kiểm tra kết quả truy vấn

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const userRef = doc(db, "employees", userDoc.id);

            console.log("User Data:", userData); // Kiểm tra dữ liệu người dùng

            const username = userData.username;
            const name = userData.name;

            // Lưu thông tin người dùng vào localStorage
            localStorage.setItem("username", username);
            localStorage.setItem("name", name);
            localStorage.setItem("userRole", userData.role);

            console.log('Username:', username);  // Debug output
            console.log('Name:', name);  // Debug output

            const welcomeMessageElement = document.getElementById("welcome-message");
            if (welcomeMessageElement) {
              welcomeMessageElement.textContent = `Chào Mừng ${username} - ${name}`;
              console.log("Welcome message updated");
            } else {
              console.error("Element with id 'welcome-message' not found.");
            }

            await updateDoc(userRef, {
              status: "online",
              lastActive: Timestamp.now(),
            });

            restrictAccess(userData.role);
          } else {
            console.error("User document not found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        alert("Please log in first.");
        window.location.href = "index.html";
      }
    });
  }
});

// Function kiểm tra và điều chỉnh quyền truy cập của menu
function restrictAccess(userRole) {
  const allowedPages = {
    "Nhân viên": ["menu-homepage", "menu-newticket", "menu-formsc", "menu-ticket-management", "menu-money-management", "menu-form-xu-ly", "receiveTicketBtn"],
    // Không cần liệt kê menu cho "admin"
  };

  if (userRole === "admin") {
    // Hiển thị tất cả menu nếu là admin
    document.querySelectorAll(".menu a").forEach((menuItem) => {
      menuItem.style.display = "block";
    });
  } else if (allowedPages[userRole]) {
    // Nếu là nhân viên, chỉ hiển thị các mục được phép
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
    alert("Lỗi: Quyền của tài khoản không hợp lệ. Vui lòng liên hệ Vĩnh.");
    window.location.href = "index.html";
    return;
  }

  // Kiểm tra quyền truy cập vào trang hiện tại
  const currentPage = window.location.pathname.split("/").pop();

  // Thêm các trang không có trong menu nhưng người dùng vẫn có thể truy cập
  const allowedUrls = allowedPages[userRole]?.map(menuId => document.getElementById(menuId)?.getAttribute("href")) || [];

  // Một số link không nằm trong menu nhưng người dùng vẫn có thể truy cập
  const externalLinks = {
    "Nhân viên": [
      "ticket-detail.html",
      // Thêm các trang vào đây nếu muốn cho phép nhân viên truy cập
    ]
  };

  // Kiểm tra nếu trang hiện tại có trong externalLinks
  if (externalLinks[userRole] && externalLinks[userRole].includes(currentPage)) {
    console.log(`Access granted to external page: ${currentPage}`);
    return;  // Cho phép truy cập trang này ngay cả khi không nằm trong menu
  }

  if (userRole === "admin") {
    return;  // Admin có thể vào tất cả trang
  }

  // Nếu không có quyền truy cập vào trang này, chuyển hướng về homepage
  if (!allowedUrls.includes(currentPage)) {
    alert("Bạn không có quyền truy cập trang này. Vui lòng liên hệ Thành Vĩnh, Dương Duy.");
    window.location.href = "homepage.html";
  }
}

// Đăng xuất người dùng
document.getElementById("logout-button").addEventListener("click", async () => {
  const confirmLogout = confirm("Bạn có muốn đăng xuất không?");
  if (!confirmLogout) return;

  try {
    await signOut(auth);
    localStorage.removeItem("userRole"); // Xóa quyền khỏi localStorage
    localStorage.removeItem("username"); // Xóa thông tin người dùng khỏi localStorage
    localStorage.removeItem("name"); // Xóa thông tin người dùng khỏi localStorage
    window.location.href = "index.html"; // Chuyển hướng về trang index
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
});

// Lắng nghe sự kiện tắt trình duyệt hoặc tab
window.addEventListener("beforeunload", async () => {
  console.log("Trình duyệt đang đóng!"); // Kiểm tra xem có chạy không

  const user = auth.currentUser;
  if (user) {
    try {
      const usersRef = collection(db, "employees");
      const q = query(usersRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, "employees", userDoc.id);

        // Cập nhật trạng thái thành offline
        await updateDoc(userRef, {
          status: "offline",
          lastActive: Timestamp.now(),
        });

        console.log("Cập nhật trạng thái offline thành công!");
      }

      // Đăng xuất Firebase Auth
      await signOut(auth);
      console.log("Đã đăng xuất Firebase!");

      // Xóa thông tin đăng nhập trong localStorage
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("name");
      console.log("Xóa localStorage thành công!");

    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  }
});
