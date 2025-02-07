import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lấy tháng hiện tại
const now = new Date();
const currentMonth = now.getMonth() + 1; // Tháng trong JS bắt đầu từ 0
const currentYear = now.getFullYear();

// Hàm lấy dữ liệu từ Firestore
async function fetchIncidentData() {
    const incidentRef = collection(db, "incidentReports");
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();
    
    // Lọc theo tháng hiện tại
    const q = query(incidentRef, 
        where("thoiGianGui", ">=", startOfMonth),
        where("thoiGianGui", "<=", endOfMonth)
    );

    const querySnapshot = await getDocs(q);
    const data = {
        "giao hàng": { "Hoàn tất": 0, "Đang xử lý": 0, "Theo dõi": 0, "Hủy": 0 },
        "chuyển hàng": { "Hoàn tất": 0, "Đang xử lý": 0, "Theo dõi": 0, "Hủy": 0 },
        "cross border": { "Hoàn tất": 0, "Đang xử lý": 0, "Theo dõi": 0, "Hủy": 0 }
    };

    querySnapshot.forEach((doc) => {
        const { issueType, status } = doc.data();
        if (data[issueType] && data[issueType][status] !== undefined) {
            data[issueType][status]++;
        }
    });

    // Cập nhật HTML
    document.getElementById("giao-hang-hoan-tat").innerText = data["Giao hàng"]["Hoàn tất"];
    document.getElementById("giao-hang-dang-xu-ly").innerText = data["Giao hàng"]["Đang xử lý"];
    document.getElementById("giao-hang-theo-doi").innerText = data["Giao hàng"]["Theo dõi"];
    document.getElementById("giao-hang-huy").innerText = data["Giao hàng"]["Hủy"];
    
    document.getElementById("chuyen-hang-hoan-tat").innerText = data["Chuyển hàng"]["Hoàn tất"];
    document.getElementById("chuyen-hang-dang-xu-ly").innerText = data["Chuyển hàng"]["Đang xử lý"];
    document.getElementById("chuyen-hang-theo-doi").innerText = data["Chuyển hàng"]["Theo dõi"];
    document.getElementById("chuyen-hang-huy").innerText = data["Chuyển hàng"]["Hủy"];
    
    document.getElementById("cross-hoan-tat").innerText = data["Cross border"]["Hoàn tất"];
    document.getElementById("cross-dang-xu-ly").innerText = data["Cross border"]["Đang xử lý"];
    document.getElementById("cross-theo-doi").innerText = data["Cross border"]["Theo dõi"];
    document.getElementById("cross-huy").innerText = data["Cross border"]["Hủy"];
}

// Gọi hàm khi trang tải
fetchIncidentData();
