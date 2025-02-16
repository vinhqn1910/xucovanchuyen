// Import Firebase modules
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lấy username từ URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Lấy username người đăng nhập từ localStorage
const usernameLoggedIn = localStorage.getItem("username") || "Unknown User";

// Truy vấn Firestore để lấy thông tin người dùng
async function getUserDetails() {
    if (!username) {
        console.error("Thiếu username trong URL.");
        return;
    }

    const usersQuery = query(collection(db, "employees"), where("username", "==", username));
    const querySnapshot = await getDocs(usersQuery);

    if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => updateUserDetails(doc.data()));
    } else {
        console.log("Không tìm thấy người dùng với username:", username);
    }
}

// Cập nhật thông tin người dùng vào DOM
function updateUserDetails(data) {
    document.getElementById('createdAt').textContent = data.createdAt || "N/A";
    document.getElementById('name').textContent = data.name || "N/A";
    document.getElementById('username').textContent = data.username || "N/A";
    document.getElementById('phone').textContent = data.phone || "N/A";
    document.getElementById('email').textContent = data.email || "N/A";
    document.getElementById('role').textContent = data.role || "N/A";
    document.getElementById('status').textContent = data.isActive || "Không hoạt động";
}

// Chỉnh sửa thông tin người dùng
function editUserInfo() {
    const fields = ['name', 'username', 'phone', 'email', 'role', 'status'];

    fields.forEach(field => {
        const element = document.getElementById(field);
        const value = element.textContent.trim();

        if (field === 'role' || field === 'status') {
            const select = document.createElement('select');
            select.id = `${field}Input`;

            if (field === 'role') {
                select.innerHTML = `
                    <option value="admin" ${value === "admin" ? 'selected' : ''}>Admin</option>
                    <option value="Nhân viên" ${value === "Nhân viên" ? 'selected' : ''}>Nhân viên</option>
                `;
            } else {
                select.innerHTML = `
                    <option value="Đang hoạt động" ${value === "Đang hoạt động" ? 'selected' : ''}>Đang hoạt động</option>
                    <option value="Không hoạt động" ${value === "Không hoạt động" ? 'selected' : ''}>Không hoạt động</option>
                `;
            }

            element.replaceWith(select);
        } else {
            element.outerHTML = `<input type="text" id="${field}Input" value="${value}">`;
        }
    });

    document.getElementById('editButtons').style.display = 'block';
    document.getElementById('editBtn').style.display = 'none';
}

// Lưu thông tin người dùng
async function saveUserInfo() {
    const updatedData = {
        name: document.getElementById('nameInput').value,
        phone: document.getElementById('phoneInput').value,
        email: document.getElementById('emailInput').value,
        role: document.getElementById('roleInput').value,
        isActive: document.getElementById('statusInput').value
    };

    const userDocRef = doc(db, 'employees', username);
    const userDoc = await getDocs(query(collection(db, 'employees'), where("username", "==", username)));

    if (!userDoc.empty) {
        const oldData = userDoc.docs[0].data();

        await updateDoc(userDocRef, updatedData);
        console.log("Thông tin người dùng đã được cập nhật.");

        // Lưu log lịch sử chỉnh sửa
        const now = new Date();
        const formattedDate = now.toLocaleString("vi-VN", { 
            day: "2-digit", 
            month: "2-digit", 
            year: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
        }).replace(/\//g, ":").replace(" ", "_").replace(":", "h");
        const logId = `${username}_${formattedDate}`;

        await setDoc(doc(db, "UserLog", logId), {
            username,
            editedBy: usernameLoggedIn,
            editedAt: Timestamp.now(),
            oldData: oldData,
            newData: updatedData
        });

        alert("Thông tin người dùng đã được cập nhật thành công!");
        window.location.href = `user-detail.html?username=${username}`;
    } else {
        console.error("Không tìm thấy người dùng.");
    }
}

// Hủy chỉnh sửa
function cancelEdit() {
    window.location.href = `user-detail.html?username=${username}`;
}

// Sự kiện cho các nút bấm
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('editBtn').addEventListener('click', editUserInfo);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('saveBtn').addEventListener('click', saveUserInfo);
    getUserDetails();
});
