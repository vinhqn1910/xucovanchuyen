import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
    "234383 - Nguyễn Thành Vĩnh",
    "18231 - Võ Dương Duy",
    "178377 - Nguyễn Thị Hồng Nhung",
    "28937 - Võ Thị Hồng Hẹn"
];

const today = new Date();
today.setHours(0, 0, 0, 0);

async function fetchWarnings() {
    const alertList = document.getElementById("alert-list");
    alertList.innerHTML = "";

    for (const user of users) {
        const q = query(
            collection(db, "incidentReports"),
            where("username", "==", user),
            where("status", "in", ["Đang xử lý", "theo dõi"])
        );

        const querySnapshot = await getDocs(q);

        let count = 0;
        let warningTickets = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const dateParts = data.thoiGianGui.split(" ")[0].split("/");
            const reportDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

            const diffTime = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
            if (diffTime >= 5) {
                count++;
                warningTickets.push({
                    username: data.username,
                    thoiGianGui: data.thoiGianGui,
                    status: data.status,
                    ticket: data.ticket || "Không có số ticket"
                });
            }
        });

        if (count > 0) {
            const alertItem = document.createElement("div");
            alertItem.innerHTML = `${user}: <span class='alert'>${count}</span>`;

            // Thêm sự kiện click để mở popup
            const alertSpan = alertItem.querySelector(".alert");
            alertSpan.addEventListener("click", () => showPopup(warningTickets));

            alertList.appendChild(alertItem);
        }
    }
}

function showPopup(tickets) {
    const popup = document.getElementById("popup");
    const ticketList = document.getElementById("ticket-list");
    ticketList.innerHTML = "";

    tickets.forEach(ticket => {
        const li = document.createElement("li");
        
        // Tạo đường link cho ticket
        const ticketLink = document.createElement("a");
        ticketLink.href = `ticket-detail.html?ticket=${encodeURIComponent(ticket.ticket)}`;
        ticketLink.textContent = `Ticket: ${ticket.ticket}`;
        ticketLink.target = "_blank"; // Mở link trong tab mới
        
        li.appendChild(ticketLink);
        li.innerHTML += ` | ${ticket.username} | ${ticket.thoiGianGui} | ${ticket.status}`;
        ticketList.appendChild(li);
    });

    popup.classList.add("active");
}


function closePopup() {
    document.getElementById("popup").classList.remove("active");
}

fetchWarnings();

window.showPopup = showPopup;
window.closePopup = closePopup;
