let currentPage = 1;
let limit = 5;
let loading = false;  // 防止多次加載
let hasMorePosts = true;  // 初始化為 true，表示第一次載入時應該有更多資料
let profileUserId = null;

document.addEventListener("DOMContentLoaded", function () {
    // 檢查 JWT token 並進行資料請求
    if (checkJwtToken()) {
        currentUserId = localStorage.getItem('currentUserId');
        currentUser = localStorage.getItem('currentUser');
        profileUserId = getQueryStringParameter('userId');
        fetchProfileData(profileUserId);
        loadPosts(profileUserId, 1, 5); // 預設載入第一頁的5篇貼文
        // 初始化 WebSocket 連接
        if (typeof initializeApp === 'function') {
            initializeApp(isPost = false);
        }
    } else {
        redirectToLogin();
    }

    // 滾動事件：當滾動到底部時加載更多貼文
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !loading && hasMorePosts) {
            currentPage++;
            loadPosts(profileUserId, currentPage, limit);
        }
    });
});

// 從伺服器獲取使用者個人資料
function fetchProfileData(userId) {
    fetchWithJwt(`/api/profile/${userId}`, {method: 'GET'})
        .then(response => response.json())
        .then(profileData => {
            displayProfile(profileData);  // 顯示個人資料
            // 如果當前使用者查看的是自己的個人資料，顯示編輯按鈕並預填表單資料
            if (currentUserId === profileData.userId) {
                showEditButton();
                populateEditForm(profileData); // 填入現有的資料到表單中
            }
        })
        .catch(error => {
            console.error('載入個人資料失敗:', error);
            alert('載入個人資料失敗');
        });
}

// 顯示個人資料的函數
function displayProfile(profile) {
    document.getElementById('username').innerText = profile.username;
    document.getElementById('userBio').innerText = profile.bio || '尚未設定簡介';
    document.getElementById('userLocation').innerText = profile.location || '尚未設定位置';
    document.getElementById('userEmail').innerText = profile.email || '尚未設定信箱';
    document.getElementById('userPhone').innerText = profile.phone || '尚未設定電話';
    document.getElementById('userBirthday').innerText = new Date(profile.birthday).toLocaleDateString()
    document.getElementById('coverPhoto').src = profile.coverPhoto || defaultCoverPhoto;
    document.getElementById('currentUserAvatar').src = profile.photo || defaultUserPhoto;
}

// 填入現有資料到編輯表單
function populateEditForm(profile) {
    document.getElementById('usernameInput').value = profile.username || '';
    document.getElementById('birthdayInput').value = profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '';
    document.getElementById('locationInput').value = profile.location || '';
    document.getElementById('userEmailInput').value = profile.email || '';
    document.getElementById('phoneInput').value = profile.phone || '';
    document.getElementById('bioInput').value = profile.bio || '';
}

// 顯示編輯按鈕
function showEditButton() {
    document.getElementById('editProfileButton').classList.remove('d-none');
}


// 顯示編輯表單
function showEditForm() {
    const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    editProfileModal.show();
}

// 提交個人資料表單
function submitProfile() {
    // 檢查使用者名稱、簡介、位置、email、手機
    const username = document.getElementById("usernameInput").value.trim();
    const bio = document.getElementById("bioInput").value.trim();
    const location = document.getElementById("locationInput").value.trim();
    const email = document.getElementById("userEmailInput").value.trim();
    const phone = document.getElementById("phoneInput").value.trim();
    if (username && username.length > 20) {
        alert("使用者名稱不得超過20個字。");
        return;
    }
    if (bio && bio.length > 200) {
        alert("簡介不得超過200個字。");
        return;
    }
    if (location && location.length > 30) {
        alert("位置描述不得超過30個字。");
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("請輸入可用的信箱。");
        return;
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
        alert("請輸入10碼格式之手機號碼。");
        return;
    }

    const coverPhoto = document.getElementById("coverPhotoInput").files[0];
    const photo = document.getElementById("photoInput").files[0];
    // 檢查圖片大小
    const maxFileSize = 2 * 1024 * 1024;
    const formData = new FormData();
    if (coverPhoto) {
        if (coverPhoto.size > maxFileSize) {
            alert("圖片大小不得超過2MB。")
            return;
        }
        formData.append("coverPhoto", coverPhoto);
    }
    if (photo) {
        if (photo.size > maxFileSize) {
            alert("圖片大小不得超過2MB。")
            return;
        }
        formData.append("photo", photo);
    }
    const birthdayInputValue = document.getElementById("birthdayInput").value;
    if (birthdayInputValue) {
        const birthdayDate = new Date(birthdayInputValue);
        if (!isNaN(birthdayDate)) { // 確保日期有效
            formData.append("birthday", birthdayDate.toISOString());
        } else {
            alert("請輸入有效的生日日期。");
            return;
        }
    }

    formData.append("userId", currentUserId);  // 使用當前使用者的ID
    formData.append("username", username);
    formData.append("location", location);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("bio", bio);
    fetchWithJwt('/api/profile', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (response.status === 201) {
                return response.json();
            } else {
                return response.json().then(err => {
                    throw new Error(err.message || '更新個人資料失敗');
                });
            }
        })
        .then(updatedProfile => {
            console.log('formData ', formData)
            displayProfile(updatedProfile);
            alert('個人資料更新成功');
            const editProfileModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            editProfileModal.hide();

            // 若提交的用戶名稱與localStorage 變數不同，更新變數
            if (currentUser !== updatedProfile.username) {
                localStorage.setItem('currentUser', updatedProfile.username);
                window.currentUser = updatedProfile.username;
                // 在post 給後端時，會寄送websocket 給 /user/name/update 更新主頁的localStorage currentUser
            }
        })
        .catch(error => {
            console.log('formData ', formData)
            console.error('錯誤:', error);
            if (error.message !== "Unauthorized") {
                alert('更新個人資料失敗: ' + error.message);
            }
        });
}

// 獲取 URL 查詢參數
function getQueryStringParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 添加事件監聽器到表單提交按鈕
document.getElementById('profileForm').addEventListener('submit', function (event) {
    event.preventDefault();
    submitProfile();
});

// ==================== 新增的貼文顯示邏輯 ====================

// 從伺服器載入用戶貼文
function loadPosts(userId, page, limit) {
    loading = true; // 開始加載資料
    fetchWithJwt(`/api/posts/user/${userId}?currentUserId=${currentUserId}&page=${page}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const posts = data.posts;
            const hasMore = data.hasMore;

            if (posts.length > 0) {
                // TODO : descending bug
                posts.forEach(post => displayPost(post, prepend = false)); // 顯示貼文
            }
            // 更新 hasMorePosts 狀態
            hasMorePosts = hasMore;
            loading = false;
        })
        .catch(error => {
            console.error('載入貼文失敗:', error);
            loading = false;
        });
}
