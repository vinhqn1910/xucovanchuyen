// user-management.js
import { firebaseConfig } from './firebase-config.js';

// Firebase initialization
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to load and display employees data
async function loadEmployees(filter = {}) {
    const tableBody = document.querySelector("#issue-table tbody");
    tableBody.innerHTML = ""; // Clear previous rows

    let query = db.collection("employees");

    // Apply filters
    if (filter.statusUser && filter.statusUser !== "Cả hai") {
        // Nếu statusUser là "Đang hoạt động" hoặc "Không hoạt động", áp dụng điều kiện
        query = query.where("isActive", "==", filter.statusUser);
    }

    if (filter.searchBy && filter.searchTerm) {
        query = query.where(filter.searchBy, "==", filter.searchTerm);
    }

    try {
        const snapshot = await query.get();
        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="7">Không tìm thấy dữ liệu</td></tr>`;
            return;
        }

        let count = 1; // Row counter
        snapshot.forEach(doc => {
            const data = doc.data();
            const status = data.isActive || "Không hoạt động"; // Hiển thị trạng thái người dùng dưới dạng chuỗi


            // Tạo đường link chi tiết người dùng, sử dụng 'username' làm ID
            const userDetailLink = `user-detail.html?username=${data.username}`;

            const row = `
                <tr>
                    <td>${count++}</td>
                    <td><a href="${userDetailLink}">${data.username || ""}</a></td> <!-- Thêm link đến trang chi tiết -->
                    <td>${data.name || ""}</td>
                    <td>${data.phone || ""}</td>
                    <td>${data.email || ""}</td>
                    <td>${status}</td> <!-- Hiển thị trạng thái người dùng -->
                    <td>${data.status || ""}</td>
                    <td>${data.role || ""}</td>
                </tr>`;
            tableBody.insertAdjacentHTML("beforeend", row);
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
    }
}

// Handle search form submission
document.getElementById("searchBtn").addEventListener("click", () => {
    const statusUser = document.getElementById("statusUser").value;
    const searchBy = document.getElementById("searchBy").value;
    const searchTerm = document.getElementById("searchTerm").value.trim();

    console.log("Status User:", statusUser);  // Kiểm tra giá trị trạng thái người dùng
    console.log("Search By:", searchBy);      // Kiểm tra trường tìm kiếm
    console.log("Search Term:", searchTerm);  // Kiểm tra giá trị tìm kiếm

    // Gọi loadEmployees khi người dùng nhấn nút tìm kiếm
    loadEmployees({
        statusUser: statusUser,  // Trạng thái tìm kiếm (Đang hoạt động / Không hoạt động / Cả hai)
        searchBy: searchTerm ? searchBy : null,  // Trường tìm kiếm (username, phone, email)
        searchTerm: searchTerm || null,  // Từ khóa tìm kiếm
    });
});
