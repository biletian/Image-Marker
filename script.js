// 全局变量
let images = [];
let currentImageIndex = -1;
const MAX_IMAGES = 50;

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const galleryContainer = document.getElementById('galleryContainer');
const imageCount = document.getElementById('imageCount');
const noImagesMessage = document.getElementById('noImagesMessage');
const downloadBtn = document.getElementById('downloadBtn');

// 模态框元素
const annotationModal = document.getElementById('annotationModal');
const modalImage = document.getElementById('modalImage');
const annotationText = document.getElementById('annotationText');
const saveAnnotationBtn = document.getElementById('saveAnnotationBtn');
const cancelAnnotationBtn = document.getElementById('cancelAnnotationBtn');

const downloadModal = document.getElementById('downloadModal');
const renameFilesCheckbox = document.getElementById('renameFiles');
const renameOptions = document.getElementById('renameOptions');
const baseFileName = document.getElementById('baseFileName');
const confirmDownloadBtn = document.getElementById('confirmDownloadBtn');
const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');

// 事件监听器
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // 上传区域事件
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // 下载按钮
    downloadBtn.addEventListener('click', openDownloadModal);
    
    // 注释模态框事件
    saveAnnotationBtn.addEventListener('click', saveAnnotation);
    cancelAnnotationBtn.addEventListener('click', closeAnnotationModal);
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // 下载模态框事件
    renameFilesCheckbox.addEventListener('change', toggleRenameOptions);
    confirmDownloadBtn.addEventListener('click', downloadImages);
    cancelDownloadBtn.addEventListener('click', closeDownloadModal);
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target === annotationModal) closeAnnotationModal();
        if (e.target === downloadModal) closeDownloadModal();
    });
}

// 文件上传函数
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('active');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('active');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('active');
    
    if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
    }
}

function handleFileSelect(e) {
    if (e.target.files) {
        processFiles(e.target.files);
    }
}

function processFiles(fileList) {
    const imageFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    // 检查添加这些文件是否会超过限制
    if (images.length + imageFiles.length > MAX_IMAGES) {
        alert(`您最多只能上传${MAX_IMAGES}张图片。只会处理前${MAX_IMAGES - images.length}张图片。`);
        imageFiles.splice(MAX_IMAGES - images.length);
    }
    
    // 处理每个图片文件
    imageFiles.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                id: generateUniqueId(),
                name: file.name,
                src: e.target.result,
                annotation: '',
                file: file
            };
            
            images.push(imageData);
            addImageToGallery(imageData);
            updateImageCount();
        };
        
        reader.readAsDataURL(file);
    });
}

// 图库函数
function addImageToGallery(imageData) {
    // 如果这是第一张图片，隐藏"没有图片"的消息
    if (images.length === 1) {
        noImagesMessage.style.display = 'none';
        downloadBtn.disabled = false;
    }
    
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    imageCard.dataset.id = imageData.id;
    
    imageCard.innerHTML = `
        <div class="image-container">
            <img src="${imageData.src}" alt="${imageData.name}">
            <div class="image-actions">
                <button class="image-action-btn edit-btn" title="编辑注释">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="image-action-btn delete-btn" title="删除图片">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="image-info">
            <div class="image-name">${imageData.name}</div>
            <div class="image-annotation ${imageData.annotation ? 'has-annotation' : ''}">
                ${imageData.annotation || '未添加注释'}
            </div>
        </div>
    `;
    
    // 为按钮添加事件监听器
    const editBtn = imageCard.querySelector('.edit-btn');
    const deleteBtn = imageCard.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => openAnnotationModal(imageData.id));
    deleteBtn.addEventListener('click', () => deleteImage(imageData.id));
    
    galleryContainer.appendChild(imageCard);
}

function updateImageCount() {
    imageCount.textContent = images.length;
}

function deleteImage(id) {
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
        images.splice(index, 1);
        
        // 从图库中移除图片卡片
        const imageCard = document.querySelector(`.image-card[data-id="${id}"]`);
        if (imageCard) {
            imageCard.remove();
        }
        
        updateImageCount();
        
        // 如果没有剩余图片，显示"没有图片"的消息
        if (images.length === 0) {
            noImagesMessage.style.display = 'flex';
            downloadBtn.disabled = true;
        }
    }
}

// 注释函数
function openAnnotationModal(id) {
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
        currentImageIndex = index;
        const imageData = images[index];
        
        modalImage.src = imageData.src;
        annotationText.value = imageData.annotation;
        
        annotationModal.style.display = 'block';
        
        // 自动聚焦到文本区域
        setTimeout(() => {
            annotationText.focus();
        }, 300);
    }
}

function closeAnnotationModal() {
    annotationModal.style.display = 'none';
    currentImageIndex = -1;
}

function saveAnnotation() {
    if (currentImageIndex !== -1) {
        const annotation = annotationText.value.trim();
        images[currentImageIndex].annotation = annotation;
        
        // 更新图库中的注释
        const imageCard = document.querySelector(`.image-card[data-id="${images[currentImageIndex].id}"]`);
        if (imageCard) {
            const annotationElement = imageCard.querySelector('.image-annotation');
            annotationElement.textContent = annotation || '未添加注释';
            annotationElement.classList.toggle('has-annotation', !!annotation);
        }
        
        closeAnnotationModal();
        
        // 显示保存成功的提示
        showToast('注释已保存');
    }
}

// 下载函数
function openDownloadModal() {
    if (images.length > 0) {
        downloadModal.style.display = 'block';
    }
}

function closeDownloadModal() {
    downloadModal.style.display = 'none';
}

function toggleRenameOptions() {
    renameOptions.style.display = renameFilesCheckbox.checked ? 'block' : 'none';
}

function downloadImages() {
    if (images.length === 0) return;
    
    // 显示下载中提示
    showToast('正在准备下载...', 0);
    
    const zip = new JSZip();
    const shouldRename = renameFilesCheckbox.checked;
    const baseName = baseFileName.value.trim() || '图片';
    
    // 将每张图片添加到zip
    const promises = images.map((imageData, index) => {
        return new Promise((resolve) => {
            // 确定文件名
            let filename;
            if (shouldRename) {
                // 从原始名称获取文件扩展名
                const ext = imageData.name.split('.').pop();
                filename = `${baseName}_${(index + 1).toString().padStart(3, '0')}.${ext}`;
            } else {
                filename = imageData.name;
            }
            
            // 将图片添加到zip
            fetch(imageData.src)
                .then(response => response.blob())
                .then(blob => {
                    zip.file(filename, blob);
                    
                    // 如果有注释，创建一个同名的文本文件
                    if (imageData.annotation) {
                        const annotationFilename = filename.substring(0, filename.lastIndexOf('.')) + '.txt';
                        zip.file(annotationFilename, imageData.annotation);
                    }
                    
                    resolve();
                });
        });
    });
    
    // 当所有图片处理完毕时生成zip文件
    Promise.all(promises).then(() => {
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, '图片集.zip');
            closeDownloadModal();
            
            // 隐藏下载中提示并显示下载完成提示
            hideToast();
            showToast('下载完成！');
        });
    });
}

// 关闭所有模态框
function closeAllModals() {
    annotationModal.style.display = 'none';
    downloadModal.style.display = 'none';
}

// 工具函数
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 提示消息函数
function showToast(message, duration = 3000) {
    // 移除现有的提示
    hideToast();
    
    // 创建新的提示
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示提示
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 如果设置了持续时间，则在指定时间后隐藏提示
    if (duration > 0) {
        setTimeout(() => {
            hideToast();
        }, duration);
    }
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
} 