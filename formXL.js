import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { 
    getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, addDoc 
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Khởi tạo Quill
var quill = new Quill("#editor", {
    theme: "snow",
    placeholder: "Nhập nội dung bài viết...",
    modules: {
        toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["clean"],
        ],
    },
});

// Tránh gọi loadPosts nhiều lần
document.addEventListener("DOMContentLoaded", () => {
    if (!window.postsLoaded) {
        loadPosts();
        window.postsLoaded = true;
    }
});

// Lưu bài viết
document.getElementById("savePostBtn").addEventListener("click", async () => {
    let title = document.getElementById("postTitle").value.trim();
    let content = quill.root.innerHTML;

    if (title === "" || content === "<p><br></p>") {
        alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
        return;
    }

    const timestamp = new Date().toLocaleString("vi-VN");
    const username = localStorage.getItem("username") || "Unknown User";
    const name = localStorage.getItem("name") || "Unknown User";

    const postRef = doc(db, "Content", title);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        await setDoc(postRef, {
            title,
            content,
            timestamp,
            username,
            name,
        });
    } else {
        alert("Bài viết được cập nhật thành công!");
    }

    document.getElementById("postTitle").value = "";
    quill.root.innerHTML = "";
    loadPosts();
});

// Tải danh sách bài viết
async function loadPosts() {
    const postList = document.getElementById("postList");
    postList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "Content"));
    querySnapshot.forEach((docSnap) => {
        const post = docSnap.data();
        if (document.querySelector(`[data-title="${post.title}"]`)) return;

        const postElement = document.createElement("div");
        postElement.classList.add("post");
        postElement.innerHTML = `
            <div class="post-header">
                <span class="tac-gia">Tác giả: </span> 
                <strong class="username blue-text">${post.username || "Unknown User"} - ${post.name || "Unknown name"}</strong>
                <span class="post-time">${post.timestamp}</span>
            </div>
            <h3 class="post-title">${post.title}</h3>
            <div class="post-content">${post.content}</div>
            <button class="edit-btn" data-title="${post.title}">Chỉnh sửa</button>
            <button class="copy-btn" data-content="${post.content}">Copy</button>
        `;
        postList.prepend(postElement);
    });
}

// Xử lý sự kiện chỉnh sửa bài viết
document.getElementById("postList").addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
        let title = e.target.getAttribute("data-title");
        let postDoc = await getDoc(doc(db, "Content", title));

        if (postDoc.exists()) {
            let postData = postDoc.data();
            document.getElementById("postTitle").value = postData.title;
            quill.root.innerHTML = postData.content;
            document.getElementById("savePostBtn").innerText = "Cập nhật bài viết";

            let cancelBtn = document.createElement("button");
            cancelBtn.id = "cancelEditBtn";
            cancelBtn.innerText = "Hủy";
            cancelBtn.classList.add("cancel-btn");
            document.getElementById("editor-container").appendChild(cancelBtn);

            cancelBtn.onclick = () => {
                if (confirm("Bạn có muốn hủy chỉnh sửa bài viết này không?")) {
                    document.getElementById("savePostBtn").innerText = "Đăng bài";
                    document.getElementById("postTitle").value = "";
                    quill.root.innerHTML = "";
                    cancelBtn.remove();
                }
            };

            document.getElementById("savePostBtn").onclick = async () => {
                let updatedTitle = document.getElementById("postTitle").value.trim();
                let updatedContent = quill.root.innerHTML;
                let now = new Date();
                let editTimestamp = now.toLocaleString("vi-VN");
                let editUsername = localStorage.getItem("username") || "Unknown User";
                let editName = localStorage.getItem("name") || "Unknown User";
                let logId = `${updatedTitle}_${now.getHours()}:${now.getMinutes()}_${now.getDate()}${(now.getMonth() + 1)}${now.getFullYear()}`;

                if (updatedTitle === "" || updatedContent === "<p><br></p>") {
                    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
                    return;
                }

                await updateDoc(doc(db, "Content", title), {
                    title: updatedTitle,
                    content: updatedContent,
                    timestamp: editTimestamp,
                });

                await setDoc(doc(db, "ContentLog", logId), {
                    title: updatedTitle,
                    oldContent: postData.content,
                    newContent: updatedContent,
                    editTime: editTimestamp,
                    editedBy: editUsername,
                    editorName: editName,
                });

                document.getElementById("savePostBtn").innerText = "Đăng bài";
                document.getElementById("postTitle").value = "";
                quill.root.innerHTML = "";
                cancelBtn.remove();
                loadPosts();
            };
        }
    }
});

// Xử lý sự kiện copy nội dung bài viết
document.getElementById("postList").addEventListener("click", async (e) => {
    if (e.target.classList.contains("copy-btn")) {
        let content = e.target.getAttribute("data-content");
        copyToClipboard(content);
    }
});

// Hàm sao chép nội dung vào clipboard
async function copyToClipboard(htmlContent) {
    try {
        await navigator.clipboard.write([
            new ClipboardItem({
                "text/html": new Blob([htmlContent], { type: "text/html" }),
                "text/plain": new Blob([htmlContent], { type: "text/plain" }),
            }),
        ]);
        alert("Đã sao chép nội dung với định dạng HTML!");
    } catch (err) {
        console.error("Lỗi khi sao chép:", err);
        alert("Không thể sao chép nội dung!");
    }
}

