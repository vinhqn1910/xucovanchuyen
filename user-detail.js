import { firebaseConfig } from './firebase-config.js';

// Firebase initialization
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Lấy 'username' từ URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Truy vấn Firestore để lấy chi tiết người dùng
db.collection("employees").where("username", "==", username).get()
    .then(querySnapshot => {
        if (!querySnapshot.empty) {
            querySnapshot.forEach(doc => {
                const data = doc.data();

                // Cập nhật thông tin chi tiết người dùng vào các phần tử trên trang
                updateUserDetails(data);
            });
        } else {
            console.log("Không tìm thấy người dùng với username:", username);
        }
    })
    .catch(error => {
        console.log("Lỗi khi truy vấn người dùng:", error);
    });

// Cập nhật thông tin người dùng vào các phần tử DOM
function updateUserDetails(data) {
    const createdAtElement = document.getElementById('createdAt');
    const nameElement = document.getElementById('name');
    const usernameElement = document.getElementById('username');
    const phoneElement = document.getElementById('phone');
    const emailElement = document.getElementById('email');
    const roleElement = document.getElementById('role');
    const statusElement = document.getElementById('status');

    if (createdAtElement && nameElement && usernameElement && phoneElement && emailElement && roleElement && statusElement) {
        createdAtElement.textContent = data.createdAt || "N/A";
        nameElement.textContent = data.name || "N/A";
        usernameElement.textContent = data.username || "N/A";
        phoneElement.textContent = data.phone || "N/A";
        emailElement.textContent = data.email || "N/A";
        roleElement.textContent = data.role || "N/A";
        statusElement.textContent = data.isActive || "Không hoạt động";
    } else {
        console.error('Không tìm thấy các phần tử thông tin người dùng!');
    }
}

// Hàm chỉnh sửa thông tin người dùng
document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');

    editBtn.addEventListener('click', editUserInfo);
    cancelBtn.addEventListener('click', cancelEdit);
    saveBtn.addEventListener('click', saveUserInfo);
});

function editUserInfo() {
    // Lấy các phần tử
    const nameElement = document.getElementById('name');
    const usernameElement = document.getElementById('username');
    const phoneElement = document.getElementById('phone');
    const emailElement = document.getElementById('email');
    const roleElement = document.getElementById('role');
    const statusElement = document.getElementById('status');
    
    // Kiểm tra sự tồn tại của các phần tử trước khi chỉnh sửa
    if (nameElement && usernameElement && phoneElement && emailElement && roleElement && statusElement) {
        const nameText = nameElement.textContent.trim();
        const usernameText = usernameElement.textContent.trim();
        const phoneText = phoneElement.textContent.trim();
        const emailText = emailElement.textContent.trim();
        const roleText = roleElement.textContent.trim();  // Lấy vai trò
        const statusText = statusElement.textContent.trim();  // Lấy trạng thái

        // Thay thế các phần tử hiện tại bằng các input hoặc select
        nameElement.outerHTML = `<input type="text" id="nameInput" value="${nameText}">`;
        usernameElement.outerHTML = `<input type="text" id="usernameInput" value="${usernameText}">`;
        phoneElement.outerHTML = `<input type="text" id="phoneInput" value="${phoneText}">`;
        emailElement.outerHTML = `<input type="email" id="emailInput" value="${emailText}">`;

        // Thay đổi ô nhập vai trò thành một dropdown select
        roleElement.outerHTML = `  
            <select id="roleInput">
                <option value="admin" ${roleText === "admin" ? 'selected' : ''}>Admin</option>
                <option value="Nhân viên" ${roleText === "Nhân viên" ? 'selected' : ''}>Nhân viên</option>
            </select>`;

        // Thay đổi trạng thái thành select
        statusElement.outerHTML = `  
            <select id="statusInput">
                <option value="Đang hoạt động" ${statusText === "Đang hoạt động" ? 'selected' : ''}>Đang hoạt động</option>
                <option value="Không hoạt động" ${statusText === "Không hoạt động" ? 'selected' : ''}>Không hoạt động</option>
            </select>`;

        // Hiển thị nút Lưu và Hủy dưới thông tin trạng thái
        const editButtons = document.getElementById('editButtons');
        editButtons.style.display = 'block';

        // Ẩn nút Chỉnh Sửa
        const editBtn = document.getElementById('editBtn');
        editBtn.style.display = 'none';
    } else {
        console.error('Một hoặc nhiều phần tử thông tin người dùng không tồn tại!');
    }
}


// Hàm lưu thông tin người dùng sau khi chỉnh sửa
function saveUserInfo() {
    // Lấy giá trị mới từ các input
    const name = document.getElementById('nameInput').value;
    const username = document.getElementById('usernameInput').value;
    const phone = document.getElementById('phoneInput').value;
    const email = document.getElementById('emailInput').value;
    const role = document.getElementById('roleInput').value;
    const status = document.getElementById('statusInput').value;

    // Cập nhật Firestore với giá trị mới
    db.collection('employees').doc(username).update({
        name,
        username,
        phone,
        email,
        role,
        isActive: status
    })
    .then(() => {
        console.log("Thông tin người dùng đã được cập nhật.");

        // Sau khi lưu, cập nhật lại UI để hiển thị thông tin mới
        updateUserDetails({ name, username, phone, email, role, isActive: status });

        // Ẩn nút Lưu và Hủy, hiển thị lại nút Chỉnh Sửa
        const editBtn = document.getElementById('editBtn');
        editBtn.style.display = 'inline-block';

        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        saveBtn.remove();
        cancelBtn.remove();

        // Hiển thị popup thông báo thành công
        alert("Thông tin người dùng đã được cập nhật thành công!");

        // Quay lại trang thông tin người dùng sau khi lưu
        window.location.href = `user-detail.html?username=${username}`;
    })
    .catch((error) => {
        console.error("Lỗi khi cập nhật người dùng:", error);
    });
}

// Hàm hủy chỉnh sửa và quay lại trang thông tin người dùng mà không thay đổi dữ liệu
function cancelEdit() {
    // Quay lại trang thông tin người dùng mà không thay đổi dữ liệu
    const username = new URLSearchParams(window.location.search).get('username');
    if (username) {
        window.location.href = `user-detail.html?username=${username}`;
    } else {
        console.error("Không thể quay lại trang thông tin người dùng do thiếu username.");
    }
}
