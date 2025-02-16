// Import Firebase modules from SDK
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, orderBy, limit, getFirestore, serverTimestamp, setDoc, Timestamp  } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase initialization
const firestore = getFirestore();

// Get `ticketId` from URL
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('ticket');

if (!ticketId) {
    alert("Không tìm thấy ticketId trong URL.");
    throw new Error("Không tìm thấy ticketId trong URL.");
}

// Fetch ticket details
const fetchTicketDetails = async (ticketId) => {
    try {
        const ticketsQuery = query(collection(firestore, "incidentReports"), where("ticket", "==", ticketId));
        const querySnapshot = await getDocs(ticketsQuery);

        if (!querySnapshot.empty) {
            querySnapshot.forEach(doc => {
                const data = doc.data();
                updateTicketDetails(data);
            });
        } else {
            alert(`Không tìm thấy ticket với ID: ${ticketId}`);
        }
    } catch (error) {
        console.error("Lỗi khi truy vấn ticket:", error);
        alert("Lỗi khi truy vấn ticket: " + error.message);
    }
};

// Update ticket details in DOM
function updateTicketDetails(data) {
    const fields = [
        { id: 'ticket', value: data.ticket },
        { id: 'username', value: data.username },
        { id: 'maSO', value: data.maSO },
        { id: 'maDHGHTK', value: data.maDHGHTK },
        { id: 'deliveryname', value: data.deliveryname },
        { id: 'issueType', value: data.issueType },
        { id: 'sendingStore', value: data.sendingStore },
        { id: 'receivingStore', value: data.receivingStore },
        { id: 'thoiGianGui', value: data.thoiGianGui },
        { id: 'userbaocao', value: data.userbaocao },
        { id: 'suCo', value: data.suCo },
        { id: 'solutionDirection', value: data.solutionDirection },
        { id: 'compensationType', value: data.compensationType },
        { id: 'compensationAmount', value: data.compensationAmount },
        { id: 'SOthanhly', value: data.SOthanhly },
        { id: 'RPOC', value: data.RPOC },
        { id: 'status', value: data.status },
        { id: 'note', value: data.note },
        { id: 'statusNVC', value: data.statusNVC },
        { id: 'KTCN', value: data.KTCN },
        { id: 'linkchotden', value: data.linkchotden },
        { id: 'codesp', value: data.codesp },
        { id: 'trangthai', value: data.trangthai },
        { id: 'imei', value: data.imei },
    ];

    const colorMappings = {
        green: ['status', 'RPOC', 'SOthanhly', 'userbaocao', 'compensationAmount', 'KTCN', 'linkchotden'],
        red: ['username'],
        blue: ['statusNVC', 'note', 'compensationType', 'solutionDirection', 'receivingStore', 'suCo', 'sendingStore', 'issueType', 'maDHGHTK', 'thoiGianGui', 'ticket', 'maSO', 'deliveryname', 'codesp', 'trangthai', 'imei']
    };

    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.textContent = field.value || '';
            element.parentElement.style.display = field.value ? 'block' : 'none';

            // Apply color
            if (colorMappings.green.includes(field.id)) {
                element.style.color = 'green';
                element.style.fontWeight = 'bold';
            } else if (colorMappings.red.includes(field.id)) {
                element.style.color = 'red';
                element.style.fontWeight = 'bold';
            } else if (colorMappings.blue.includes(field.id)) {
                element.style.color = 'blue';
                element.style.fontWeight = 'bold';
            }
        }
    });
}

// Format currency
// XỬ LÝ DẤU PHẨY KHI NHẬP VÀO Ô CHỐT ĐỀN
function formatCurrency(input) {
    // Lấy giá trị của input
    let value = input.value;

    // Xóa tất cả các ký tự không phải là số
    value = value.replace(/[^\d]/g, '');

    // Định dạng lại số và thêm dấu phẩy
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Cập nhật lại giá trị cho input
    input.value = value;
}

// Xử lý sự kiện chỉnh sửa thông tin ticket
document.addEventListener('DOMContentLoaded', function () {
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    editBtn.addEventListener('click', enableEditMode);
    saveBtn.addEventListener('click', saveTicketInfo);
    cancelBtn.addEventListener('click', cancelEdit);

    document.body.addEventListener('change', function (e) {
        const { id, value } = e.target;
        if (id === 'issueType') {
            toggleReceivingStore(value);
        } else if (id === 'compensationType') {
            toggleCompensationAmount(value);
        }
    });
});

// Load comments
const loadComments = async () => {
    try {
        const commentsList = document.getElementById('commentsList');
        const commentsQuery = query(collection(firestore, `tickets/${ticketId}/comments`), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(commentsQuery);

        commentsList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment');

            // Hiển thị thêm phần name
            commentDiv.innerHTML = `
                <div class="comment-header">
                    <strong class="username">${data.username} - ${data.name || 'No Name'}</strong>
                    <span class="comment-time">${data.timestamp?.toDate().toLocaleString()}</span>
                </div>
                <div class="comment-text">${data.text}</div>
            `;
            commentsList.appendChild(commentDiv);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
    }
};


// Submit comment
const submitComment = async () => {
    const newComment = document.getElementById('newComment').value.trim();
    if (!newComment) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const usersQuery = query(collection(firestore, "employees"), where("userId", "==", user.uid));
                const userSnapshot = await getDocs(usersQuery);

                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    const username = userData.username || "Unknown User";
                    const name = userData.name || "Unknown Name"; // Lấy thêm name từ dữ liệu người dùng

                    await addDoc(collection(firestore, `tickets/${ticketId}/comments`), {
                        username,
                        name, // Thêm name vào dữ liệu bình luận
                        text: newComment,
                        timestamp: serverTimestamp(),
                    });

                    document.getElementById('newComment').value = '';
                    loadComments();
                } else {
                    alert("Không tìm thấy thông tin người dùng.");
                }
            } catch (error) {
                console.error("Error submitting comment:", error);
            }
        } else {
            alert("Bạn cần đăng nhập để bình luận.");
        }
    });
};


// Enable edit mode
const enableEditMode = () => {
    const editableFields = [
        { id: 'maDHGHTK', type: 'text' },
        { id: 'deliveryname', type: 'select', options: ['GHTK', 'Ahamove', 'Grab', 'crossborder'] },
        { id: 'issueType', type: 'select', options: ['giao hàng', 'chuyển hàng'] },
        { id: 'sendingStore', type: 'text' },
        { id: 'receivingStore', type: 'text' },
        { id: 'suCo', type: 'text' },
        { id: 'solutionDirection', type: 'text' },
        { id: 'compensationType', type: 'select', options: ['ST tự xử lý', 'chốt đền nguyên kiện', 'chốt đền 20%', 'khác'] },
        { id: 'compensationAmount', type: 'text', attributes: { oninput: "formatCurrency(this)" } },
        { id: 'SOthanhly', type: 'text' },
        { id: 'RPOC', type: 'text' },
        { id: 'status', type: 'select', options: ['Đang xử lý', 'theo dõi', 'hoàn tất', 'hủy'] },
        { id: 'note', type: 'text' },
        { id: 'statusNVC', type: 'select', options: ['Đợi đối soát', 'Đã gửi báo cáo', 'Hoàn tất', 'Hoàn tiền', 'Khác'] },
        { id: 'linkchotden', type: 'text' },
        { id: 'KTCN', type: 'text' },
        { id: 'codesp', type: 'text' },
        { id: 'trangthai', type: 'select', options: ['Đã sử dụng', 'Mới giảm giá']  },
        { id: 'imei', type: 'text' },
    ];

    editableFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            const value = element.textContent.trim();
            if (field.type === 'select') {
                const options = field.options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('');
                element.outerHTML = `<select id="${field.id}">${options}</select>`;
            } else {
                element.outerHTML = `<input type="text" id="${field.id}" value="${value}">`;
            }
        }
    });

    document.getElementById('editButtons').style.display = 'block';
    document.getElementById('editBtn').style.display = 'none';
    toggleReceivingStore(document.getElementById('issueType').value);
    toggleCompensationAmount(document.getElementById('compensationType').value);
};

// Định dạng số tiền khi nhập
document.body.addEventListener('input', function (e) {
    if (e.target.id === 'compensationAmount') {
        e.target.value = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
});

function toggleReceivingStore(issueType) {
    const receivingStoreElement = document.getElementById('receivingStore');
    const sendingStoreElement = document.getElementById('sendingStore'); // Thêm dòng này
    if (issueType == 'chuyển hàng') {
        sendingStoreElement.parentElement.style.display = 'block';
        receivingStoreElement.parentElement.style.display = 'block';
    } else {
        receivingStoreElement.parentElement.style.display = 'none';
        sendingStoreElement.parentElement.style.display = 'block';
    }
}


function toggleCompensationAmount(compensationType) {
    const compensationAmountElement = document.getElementById('compensationAmount');
    const SOthanhlyElement = document.getElementById('SOthanhly');
    const RPOCElement = document.getElementById('RPOC');
    const compensationTypeElement = document.getElementById('compensationType');
    const solutionDirectionElement = document.getElementById('solutionDirection');
    const statusNVCElement = document.getElementById('statusNVC');
    const KTCNElement = document.getElementById('KTCN');
    const linkchotdenElement = document.getElementById('linkchotden');
    const codespElement = document.getElementById('codesp');
    const trangthaiElement = document.getElementById('trangthai');
    const imeiElement = document.getElementById('imei');

    // Reset hiển thị mặc định
    solutionDirectionElement.parentElement.style.display = 'block';
    compensationTypeElement.parentElement.style.display = 'block';
    compensationAmountElement.parentElement.style.display = 'none';
    SOthanhlyElement.parentElement.style.display = 'none';
    RPOCElement.parentElement.style.display = 'none';
    statusNVCElement.parentElement.style.display = 'none';
    KTCNElement.parentElement.style.display = 'none';
    linkchotdenElement.parentElement.style.display = 'none';
    codespElement.parentElement.style.display = 'none';
    trangthaiElement.parentElement.style.display = 'none';
    imeiElement.parentElement.style.display = 'none';

    if (compensationType === 'chốt đền nguyên kiện') {
        compensationAmountElement.parentElement.style.display = 'block';
        statusNVCElement.parentElement.style.display = 'block';
        // Hiển thị ô nhập mã SOthanhly
        SOthanhlyElement.parentElement.style.display = 'block';
        linkchotdenElement.parentElement.style.display = 'block';
        KTCNElement.parentElement.style.display = 'block';
        codespElement.parentElement.style.display = 'block';
        trangthaiElement.parentElement.style.display = 'block';
        imeiElement.parentElement.style.display = 'block';

    } else if (compensationType === 'chốt đền 20%') {
        compensationAmountElement.parentElement.style.display = 'block';
        statusNVCElement.parentElement.style.display = 'block';
        KTCNElement.parentElement.style.display = 'block';
        linkchotdenElement.parentElement.style.display = 'block';
        // Hiển thị ô RPOC
        RPOCElement.parentElement.style.display = 'block';
        codespElement.parentElement.style.display = 'block';
        trangthaiElement.parentElement.style.display = 'block';
        imeiElement.parentElement.style.display = 'block';

    } else if (['khác'].includes(compensationType)) {
        // Hiển thị ô nhập số tiền
        compensationAmountElement.parentElement.style.display = 'block';
        statusNVCElement.parentElement.style.display = 'block';
        KTCNElement.parentElement.style.display = 'block';
        linkchotdenElement.parentElement.style.display = 'block';
        codespElement.parentElement.style.display = 'block';
        trangthaiElement.parentElement.style.display = 'block';
        imeiElement.parentElement.style.display = 'block';

    }
}



// Save ticket info
const saveTicketInfo = async () => {
    const updatedData = {};
    const fields = [
        'maDHGHTK', 'deliveryname', 'issueType', 'sendingStore', 'receivingStore',
        'suCo', 'solutionDirection', 'compensationType', 'compensationAmount',
        'SOthanhly', 'RPOC', 'status', 'note', 'statusNVC', 'linkchotden', 'KTCN', 'codesp', 'trangthai', 'imei',
    ];

    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            let value = element.value.trim() || '';
            updatedData[field] = value;
        }
    });

    // Lấy thời gian hiện tại và định dạng ddmmyyyy_hhmm
    const now = new Date();
    const formattedDate = now.toLocaleString("vi-VN", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric", 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: false 
    }).replace(/\//g, ":").replace(" ", "_").replace(":", "h");

    // Tạo ID cho document: ticketId_ddmmyyyy_hhmm
    const logId = `${ticketId}_${formattedDate}`;

    updatedData.timeUpdate = Timestamp.now(); // Firebase timestamp

    // Lấy thông tin người dùng đăng nhập
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const usersQuery = query(collection(firestore, "employees"), where("userId", "==", user.uid));
                const userSnapshot = await getDocs(usersQuery);

                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    const username = userData.username || "Unknown User";

                    updatedData.editedBy = username; // Ghi lại ai đã chỉnh sửa

                    // Tìm ticket có ticketId
                    const ticketsQuery = query(collection(firestore, "incidentReports"), where("ticket", "==", ticketId));
                    const querySnapshot = await getDocs(ticketsQuery);

                    if (!querySnapshot.empty) {
                        const ticketDoc = querySnapshot.docs[0];
                        const oldData = ticketDoc.data(); // Lấy dữ liệu cũ

                        await updateDoc(doc(firestore, "incidentReports", ticketDoc.id), updatedData);

                        // Lưu lịch sử chỉnh sửa vào TicketLog
                        await setDoc(doc(firestore, "TicketLog", logId), {
                            ticketId,
                            editedBy: username, 
                            editedAt: Timestamp.now(),
                            oldData: oldData,
                            newData: updatedData
                        });

                        alert("Thông tin ticket đã được cập nhật thành công!");
                        window.location.reload();
                    } else {
                        alert("Không tìm thấy ticket với ID: " + ticketId);
                    }
                } else {
                    alert("Không tìm thấy thông tin người dùng.");
                }
            } catch (error) {
                console.error("Lỗi khi cập nhật ticket:", error);
                alert("Lỗi khi cập nhật ticket: " + error.message);
            }
        } else {
            alert("Bạn cần đăng nhập để cập nhật ticket.");
        }
    });
};


// Cancel edit mode
const cancelEdit = () => {
    window.location.reload();
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('editBtn').addEventListener('click', enableEditMode);
    document.getElementById('saveBtn').addEventListener('click', saveTicketInfo);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('submitCommentBtn').addEventListener('click', submitComment);
    loadComments();
});

// Add event listener for "Create chuyển hàng Info"
document.addEventListener('DOMContentLoaded', () => {
    const createCompensationInfoBtn = document.getElementById('createCompensationInfoBtn');
    createCompensationInfoBtn.addEventListener('click', generateCompensationInfo); // chênh lệch

    const createCompensationNKInfoBtn = document.getElementById('createCompensationNKInfoBtn');
    createCompensationNKInfoBtn.addEventListener('click', generateCompensationNKInfo); // nguyên kiện
});

// Tạo thông tin chốt đền chênh lệch
const generateCompensationInfo = async () => {
    try {
        const ticketElement = document.getElementById('ticket');
        const maSOElement = document.getElementById('maSO');
        const maDHGHTKElement = document.getElementById('maDHGHTK');
        const suCoElement = document.getElementById('suCo');
        const deliverynameElement = document.getElementById('deliveryname');
        const receivingStoreElement = document.getElementById('receivingStore');
        const compensationAmountElement = document.getElementById('compensationAmount');
        const userbaocaoElement = document.getElementById('userbaocao');
        const KTCNElement = document.getElementById('KTCN');
        const linkchotdenElement = document.getElementById('linkchotden');
        const codespElement = document.getElementById('codesp');
        const trangthaiElement = document.getElementById('trangthai');
        const imeiElement = document.getElementById('imei');
        if (!ticketElement || !maSOElement || !maDHGHTKElement || !receivingStoreElement || !compensationAmountElement || !suCoElement) {
            alert("Thiếu dữ liệu để tạo thông tin chốt đền.");
            return;
        }

        // Replace placeholders with data from ticket
        const reportContent = `
Gửi kho <span style="color: red;"><strong>${receivingStoreElement.textContent.trim()}</strong></span>
Trường hợp này NVC <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span> xác nhận đền bù GTHH chênh lệch.

**THÔNG TIN CHỐT ĐỀN**:
- Mã Bill: <span style="color: red;"><strong>${maDHGHTKElement.textContent.trim()}</strong></span>
- MLC:  <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span>
- SP: <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span>
- Hình thức giao hàng: qua đối tác  <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span>

1. Nhờ Thu - 181922 KTNV hỗ trợ hạch toán bill NVC GHTK giúp.
2. Nhờ kho <span style="color: red;"><strong>${receivingStoreElement.textContent.trim()}</strong></span> :
    - Tick nhận MLC <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span> vào kho và hỗ trợ tạo yêu cầu đổi trạng thái từ MỚI sang <span style="color: red;"><strong>${trangthaiElement.textContent.trim()}</strong></span>.
    - Nhờ A/c QLST và Team kho phản hồi cho KTCN mã yêu cầu đổi trạng thái (MYC: OC / RP) qua báo cáo này giúp.
3. Nhờ A/c KTCN - <span style="color: red;"><strong>${KTCNElement.textContent.trim()}</strong></span> hỗ trợ duyệt chứng từ đổi trạng thái này giúp siêu thị.
4. Khi KTNV hoàn tất hạch toán với NVC GHTK thì Team Hỗ Trợ Giao - Chuyển Hàng sẽ phản hồi MÃ OT để A/c KTCN nắm thông tin nhé.
Nội dung:
Phí đổi trạng thái sp <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span> số lượng 1 cái, từ Mới sang <span style="color: red;"><strong>${trangthaiElement.textContent.trim()}</strong></span>, do GHTK làm <span style="color: red;"><strong>${suCoElement.textContent.trim()}</strong></span> chốt đền 20% GTHH.

- IMEI SP: <span style="color: red;"><strong>${imeiElement.textContent.trim()||"Không có imei"}</strong></span>
- Thông tin GTHH chốt đền:  <span style="color: red;"><strong>${linkchotdenElement.textContent.trim()} </strong></span>
- Số tiền: <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span> (Có VAT)

Team hỗ trợ giao - chuyển hàng chân thành cảm ơn!

Lưu ý:
Anh/Chị cần thêm thông tin chi tiết vui lòng liên hệ user gửi báo cáo hoặc chát Group online khu vực để được hỗ trợ.
`;

        // Display generated content in a modal or a dedicated section
        const reportSection = document.getElementById('compensationReport');
        if (reportSection) {
            reportSection.innerHTML = `<pre>${reportContent}</pre>`;
            reportSection.style.display = 'block';
            reportSection.classList.add('report-section'); // Áp dụng lớp CSS
            reportSection.style.fontFamily = 'cambria';
        } else {
            alert("Không tìm thấy khu vực để hiển thị báo cáo.");
        }

    } catch (error) {
        console.error("Lỗi khi tạo thông tin chốt đền:", error);
        alert("Lỗi khi tạo thông tin chốt đền: " + error.message);
    }
};

// Tạo thông tin chốt đền nguyên kiện
const generateCompensationNKInfo = async () => { 
    try {
        const ticketElement = document.getElementById('ticket');
        const maSOElement = document.getElementById('maSO');
        const maDHGHTKElement = document.getElementById('maDHGHTK');
        const suCoElement = document.getElementById('suCo');
        const deliverynameElement = document.getElementById('deliveryname');
        const receivingStoreElement = document.getElementById('receivingStore');
        const compensationAmountElement = document.getElementById('compensationAmount');
        const userbaocaoElement = document.getElementById('userbaocao');
        const KTCNElement = document.getElementById('KTCN');
        const linkchotdenElement = document.getElementById('linkchotden');
        const codespElement = document.getElementById('codesp');
        const trangthaiElement = document.getElementById('trangthai');
        const imeiElement = document.getElementById('imei');

        if (!ticketElement || !maSOElement || !maDHGHTKElement || !receivingStoreElement || !compensationAmountElement || !suCoElement) {
            alert("Thiếu dữ liệu để tạo thông tin chốt đền.");
            return;
        }

        // Replace placeholders with data from ticket
        const reportContent = `
Gửi kho <span style="color: red;"><strong>${receivingStoreElement.textContent.trim()}</strong></span>
Trường hợp này NVC <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span> xác nhận đền bù.

THÔNG TIN CHỐT ĐỀN:
Mã bill: <span style="color: red;"><strong>${maDHGHTKElement.textContent.trim()}</strong></span>
MLC: <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span>
SP: <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span>
IMEI SP: <span style="color: red;"><strong>${imeiElement.textContent.trim()||"Không có imei"}</strong></span>
Số lượng:   <span style="color: red;"><strong>1 cái</strong></span>
NVC: <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span>
Bill này <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span> chốt đền với TGDD, do đối tác giao hàng làm <span style="color: red;"><strong>${suCoElement.textContent.trim()}</strong></span>
Team HTGH có trao đổi với đối tác thì đối tác đồng ý chốt đền nguyên đơn hàng có GTHH là <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span> (Có VAT)
Thông tin GTHH chốt đền: <span style="color: red;"><strong>${linkchotdenElement.textContent.trim()} </strong></span>

HƯỚNG XỬ LÝ NHƯ SAU:

- Kho tick nhận MLC <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span> vào kho sau đó phản hồi lại team qua line, Team HTGH sẽ tạo lại 1 ĐH THANH LÝ cho KCN để xuất hàng này ra, 
phát sinh công nợ số tiền là <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span>, số tiền này đối tác chốt đền bù cho cty. Đối tác sẽ chuyển khoản thanh toán cho cty vào kì đối soát công nợ gần nhất 
(đối tác chuyển khoản thanh toán vào thừ 2 - 4 - 6 hàng tuần ). kho cho shipper thu hồi hàng ( nếu đang giữ hàng).  

- Khi GHTK thanh toán qua cty thì kế toán nghiệp vụ sẽ cập nhật tiền vào đơn thanh lý để hoàn tất công nợ cho st nhé

- Nhờ A/c Team KCN nhận thông tin hỗ trợ trường hợp này giúp. ST hỗ trợ FW cho kế toán chi nhánh phối hợp hỗ trợ xử lý nhé.

Team hỗ trợ giao - chuyển hàng chân thành cảm ơn!
Lưu ý:
Anh/Chị cần thêm thông tin chi tiết vui lòng liên hệ user gửi báo cáo hoặc chát Group online khu vực để được hỗ trợ.
`;

        // Display generated content in a modal or a dedicated section
        const reportSection = document.getElementById('compensationReport');
        if (reportSection) {
            reportSection.innerHTML = `<pre>${reportContent}</pre>`;
            reportSection.style.display = 'block';
            reportSection.classList.add('report-section'); // Áp dụng lớp CSS
        } else {
            alert("Không tìm thấy khu vực để hiển thị báo cáo.");
        }

    } catch (error) {
        console.error("Lỗi khi tạo thông tin chốt đền:", error);
        alert("Lỗi khi tạo thông tin chốt đền: " + error.message);
    }
};


// Add event listener for "Create giao hàng Info"
document.addEventListener('DOMContentLoaded', () => {
    const SOcreateCompensationInfoBtn = document.getElementById('SOcreateCompensationInfoBtn');
    SOcreateCompensationInfoBtn.addEventListener('click', SOgenerateCompensationInfo); // chốt 20%

    const SOcreateCompensationNKInfoBtn = document.getElementById('SOcreateCompensationNKInfoBtn');
    SOcreateCompensationNKInfoBtn.addEventListener('click', SOgenerateCompensationNKInfo); // chốt nguyên kiện
});

// Tạo thông tin chốt đền chênh lệch giao hàng
const SOgenerateCompensationInfo = async () => {
    try {
        const ticketElement = document.getElementById('ticket');
        const maSOElement = document.getElementById('maSO');
        const maDHGHTKElement = document.getElementById('maDHGHTK');
        const suCoElement = document.getElementById('suCo');
        const deliverynameElement = document.getElementById('deliveryname');
        const sendingStoreElement = document.getElementById('sendingStore');
        const compensationAmountElement = document.getElementById('compensationAmount');
        const userbaocaoElement = document.getElementById('userbaocao');
        const KTCNElement = document.getElementById('KTCN');
        const linkchotdenElement = document.getElementById('linkchotden');
        const codespElement = document.getElementById('codesp');
        const trangthaiElement = document.getElementById('trangthai');
        const imeiElement = document.getElementById('imei');
        if (!ticketElement || !maSOElement || !maDHGHTKElement || !sendingStoreElement || !compensationAmountElement || !suCoElement) {
            alert("Thiếu dữ liệu để tạo thông tin chốt đền.");
            return;
        }

        // Replace placeholders with data from ticket
        const reportContent = `
Chào Anh/Chị QLST <span style="color: red;"><strong>${sendingStoreElement.textContent.trim()}</strong></span>

Trường hợp này NVC <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span> xác nhận đền bù.
THÔNG TIN CHỐT ĐỀN: 
Mã Bill: <span style="color: red;"><strong>${maDHGHTKElement.textContent.trim()}</strong></span> 
MĐH: <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span>
SP: <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span> - số lượng: <span style="color: red;"><strong>1 cái</strong></span> 
IMEI SP: <span style="color: red;"><strong>${imeiElement.textContent.trim()|"Không có imei"}</strong></span>
Hình thức giao hàng : qua đối tác <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span>

1/ Nhờ Thu - 181922 KTNV hỗ trợ không thu COD vào bill này và hạch toán bill NVC GHTK giúp.
2/ Nhờ A/c QLST <span style="color: red;"><strong>${sendingStoreElement.textContent.trim()}</strong></span>
- Nhập trả chưa sử dụng đơn hàng này : <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span> và hỗ trợ tạo yêu cầu đổi trạng thái từ MỚI sang <span style="color: red;"><strong>${trangthaiElement.textContent.trim()}</strong></span>, do GHTK làm <span style="color: red;"><strong>${suCoElement.textContent.trim()}</strong></span>
- Nhờ st tham gia Gr hoàn bill để được xác nhận nhập trả csd nhé
Link:  https://line.me/ti/g/cm8oLNhT7p
- Nhờ A/c QLST và Team kho phản hồi cho KTCN mã yêu cầu đổi trạng thái ( MYC: OC /RP) qua báo cáo này giúp.

3/ Nhờ A/c KTCN - <span style="color: red;"><strong>${KTCNElement.textContent.trim()}</strong></span> hỗ trợ duyệt chứng từ đổi trạng thái này giúp siêu thị.
4/ Khi KTNV hoàn tất hạch toán với NVC GHTK  thì Team Hỗ Trợ Giao - Chuyển Hàng sẽ phản hồi MÃ OT để A/c KTCN nắm thông tin nhé.

Nội dung: Phí đổi code sp <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span> số lượng 1 cái, từ MỚI sang <span style="color: red;"><strong>${trangthaiElement.textContent.trim()}</strong></span>, do GHTK làm <span style="color: red;"><strong>${suCoElement.textContent.trim()}</strong></span>.
Thông tin GTHH chốt đền: <span style="color: red;"><strong>${linkchotdenElement.textContent.trim()} </strong></span>
Số tiền: <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span> (Có VAT)
Team hỗ trợ giao - chuyển hàng chân thành cảm ơn!
Lưu ý:
Anh/Chị cần thêm thông tin chi tiết vui lòng liên hệ user gửi báo cáo hoặc chát Group online khu vực để được hỗ trợ. 

`;

        // Display generated content in a modal or a dedicated section
        const reportSection = document.getElementById('compensationReport');
        if (reportSection) {
            reportSection.innerHTML = `<pre>${reportContent}</pre>`;
            reportSection.style.display = 'block';
            reportSection.classList.add('report-section'); // Áp dụng lớp CSS
            reportSection.style.fontFamily = 'cambria';
        } else {
            alert("Không tìm thấy khu vực để hiển thị báo cáo.");
        }

    } catch (error) {
        console.error("Lỗi khi tạo thông tin chốt đền:", error);
        alert("Lỗi khi tạo thông tin chốt đền: " + error.message);
    }
};

// Tạo thông tin chốt đền nguyên kiện giao hàng
const SOgenerateCompensationNKInfo = async () => {
    try {
        const ticketElement = document.getElementById('ticket');
        const maSOElement = document.getElementById('maSO');
        const maDHGHTKElement = document.getElementById('maDHGHTK');
        const suCoElement = document.getElementById('suCo');
        const deliverynameElement = document.getElementById('deliveryname');
        const sendingStoreElement = document.getElementById('sendingStore');
        const compensationAmountElement = document.getElementById('compensationAmount');
        const userbaocaoElement = document.getElementById('userbaocao');
        const KTCNElement = document.getElementById('KTCN');
        const linkchotdenElement = document.getElementById('linkchotden');
        const codespElement = document.getElementById('codesp');
        const trangthaiElement = document.getElementById('trangthai');
        const imeiElement = document.getElementById('imei');

        if (!ticketElement || !maSOElement || !maDHGHTKElement || !sendingStoreElement || !compensationAmountElement || !suCoElement) {
            alert("Thiếu dữ liệu để tạo thông tin chốt đền.");
            return;
        }

        // Replace placeholders with data from ticket
        const reportContent = `
Chào Anh/Chị QLST <span style="color: red;"><strong>${sendingStoreElement.textContent.trim()}</strong></span>
Trường hợp này NVC GHTK xác nhận đền bù.

THÔNG TIN CHỐT ĐỀN: 
Mã Bill: <span style="color: red;"><strong>${maDHGHTKElement.textContent.trim()}</strong></span> 
MĐH: <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span>
SP: <span style="color: red;"><strong>${codespElement.textContent.trim()}</strong></span> - số lượng: <span style="color: red;"><strong>1 cái</strong></span> 
IMEI SP: <span style="color: red;"><strong>${imeiElement.textContent.trim()}|"Không có imei"</strong></span>
Hình thức giao hàng : qua đối tác <span style="color: red;"><strong>${deliverynameElement.textContent.trim()}</strong></span>

Bill này GHTK chốt đền với TGDD, do đối tác làm <span style="color: red;"><strong>${suCoElement.textContent.trim()}</strong></span>.
Team HTGH có trao đổi với đối tác thì đối tác chịu chốt đền nguyên đơn hàng có GTHH là <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span> (Có VAT)

Hướng xử lý như sau:

- ST nhập trả đơn hàng <span style="color: red;"><strong>${maSOElement.textContent.trim()}</strong></span> vào kho trạng thái là CHƯA SỬ DỤNG giúp , sau đó Team HTGH sẽ tạo lại 1 đh thanh lý cho st để xuất hàng này ra,
phát sinh công nợ số tiền là <span style="color: red;"><strong>${compensationAmountElement.textContent.trim()}</strong></span> VNĐ, số tiền này đối tác chốt đền bù cho cty. 
Đối tác sẽ chuyển khoản thanh toán cho cty vào kì đối soát công nợ gần nhất ( đối tác chuyển khoản thanh toán vào thừ 2 - 4 - 6 hàng tuần ). 
kho cho shipper thu hồi hàng ( nếu đang giữ hàng)
- Nhờ st tham gia Gr hoàn bill để được xác nhận nhập trả csd nhé
Link: https://line.me/ti/g/cm8oLNhT7p
- Khi GHTK thanh toán qua cty thì kế toán nghiệp vụ sẽ cập nhật tiền vào đơn thanh lý để hoàn tất công nợ cho st nhé
- Nhờ A/C QLST và Team kho nhận thông tin hỗ trợ trường hợp này giúp. ST hỗ trợ FW cho kế toán chi nhánh phối hợp hỗ trợ xử lý nhé.

Team hỗ trợ giao - chuyển hàng chân thành cảm ơn!
Lưu ý:
Anh/Chị cần thêm thông tin chi tiết vui lòng liên hệ user gửi báo cáo hoặc chát Group online khu vực để được hỗ trợ.

`;

        // Display generated content in a modal or a dedicated section
        const reportSection = document.getElementById('compensationReport');
        if (reportSection) {
            reportSection.innerHTML = `<pre>${reportContent}</pre>`;
            reportSection.style.display = 'block';
            reportSection.classList.add('report-section'); // Áp dụng lớp CSS
        } else {
            alert("Không tìm thấy khu vực để hiển thị báo cáo.");
        }

    } catch (error) {
        console.error("Lỗi khi tạo thông tin chốt đền:", error);
        alert("Lỗi khi tạo thông tin chốt đền: " + error.message);
    }
};

document.getElementById('copyButton').addEventListener('click', () => {
    const reportSection = document.getElementById('compensationReport');
    if (reportSection && reportSection.style.display !== 'none') {
        const textToCopy = reportSection.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('Nội dung đã được sao chép vào clipboard.');
            })
            .catch(err => {
                console.error('Lỗi khi sao chép nội dung:', err);
                alert('Không thể sao chép nội dung.');
            });
    } else {
        alert('Không có nội dung để sao chép.');
    }
});

document.getElementById('toggleButton').addEventListener('click', () => {
    const reportSection = document.getElementById('compensationReport');
    if (reportSection) {
        if (reportSection.style.display === 'none') {
            reportSection.style.display = 'block';
        } else {
            reportSection.style.display = 'none';
        }
    }
});

// Fetch ticket details
fetchTicketDetails(ticketId);

