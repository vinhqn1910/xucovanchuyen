import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

// Firebase Configuration
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('incidentForm');

// Hàm định dạng thời gian theo ngày/tháng/năm giờ:phút:giây
function formatDateTime(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Hàm kiểm tra mã SO và tạo ticket
async function checkAndGenerateTicket(maSO) {
  const incidentCollection = collection(db, "incidentReports");
  const ticketCollection = query(incidentCollection, orderBy("ticketNumber", "desc"), limit(1));

  const [soQuerySnapshot, ticketQuerySnapshot] = await Promise.all([
    getDocs(query(incidentCollection, where("maSO", "==", maSO))),
    getDocs(ticketCollection)
  ]);

  if (!soQuerySnapshot.empty) {
    return {
      exists: true,
      existingTicket: soQuerySnapshot.docs[0].data().ticket
    };
  }

  const lastTicketNumber = ticketQuerySnapshot.empty ? 0 : ticketQuerySnapshot.docs[0].data().ticketNumber || 0;
  return {
    exists: false,
    ticket: `ticket${lastTicketNumber + 1}`,
    ticketNumber: lastTicketNumber + 1
  };
}

// Xử lý gửi form
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const maSO = form.maSO.value.trim();
  const formData = {
    maSO: maSO,
    maDHGHTK: form.maDHGHTK.value.trim(),
    deliveryname: form.deliveryname.value.trim(),
    suCo: form.suCo.value.trim(),
    userbaocao: form.userbaocao.value.trim(),
    compensationAmount: form.compensationAmount.value.trim(),
    note: form.note.value.trim(),
    thoiGianHen: form.thoiGian.value,
    thoiGianGui: formatDateTime(new Date()),
    status: "Tạo mới",
    issueType: "giao hàng"
  };

  Swal.fire({
    title: 'Đang xử lý...',
    text: 'Vui lòng chờ trong giây lát!',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const { exists, ticket, ticketNumber, existingTicket } = await checkAndGenerateTicket(maSO);

    if (exists) {
      Swal.fire({
        title: `Cập nhật trùng TICKET: #${existingTicket}`,
        text: 'Vui lòng liên hệ 18231 - Duy, 234383 - Vĩnh, 178377 - Nhung, 28937 - Hẹn để chỉnh sửa thông tin.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      formData.ticket = ticket;
      formData.ticketNumber = ticketNumber;

      await setDoc(doc(db, "incidentReports", maSO), formData);

      Swal.fire({
        title: 'Thành công!',
        text: `Đã cập nhật thành công. Mã ticket: #${ticket}`,
        icon: 'success',
        confirmButtonText: 'OK'
      });

      form.reset();
    }
  } catch (error) {
    Swal.fire({
      title: 'Thất bại!',
      text: 'Có lỗi xảy ra, vui lòng thử lại.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    console.error("Error adding document: ", error);
  }
});

// Vô hiệu hóa nhấn chuột phải và phím Developer Tools
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
    alert('Action not allowed!');
  }
});
