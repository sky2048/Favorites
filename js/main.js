// 全局变量存储书签数据
let bookmarksData = null;

// 全局变量跟踪状态
let isDeleteConfirmShowing = false;
let isMoveModalShowing = false;

// 从 bookmarks.json 加载数据
async function loadBookmarks() {
    try {
        // 首先尝试从localStorage加载数据
        const localData = localStorage.getItem('bookmarksData');
        if (localData) {
            try {
                bookmarksData = JSON.parse(localData);
                console.log('从本地存储加载书签数据成功');
                return bookmarksData;
            } catch (localError) {
                console.error('解析本地存储的书签数据失败:', localError);
                // 如果本地数据解析失败，继续尝试从文件加载
            }
        }
        
        // 如果本地存储没有数据，从文件加载
        const response = await fetch('bookmarks.json');
        if (!response.ok) {
            throw new Error('无法加载书签数据');
        }
        bookmarksData = await response.json();
        
        // 将加载的数据保存到本地存储
        localStorage.setItem('bookmarksData', JSON.stringify(bookmarksData));
        
        return bookmarksData;
    } catch (error) {
        console.error('加载书签失败:', error);
        showToast('加载书签数据失败，请刷新页面重试');
        return null;
    }
}

// 统计所有书签总数
function getTotalBookmarksCount() {
    let total = 0;
    if (bookmarksData) {
        // 收藏夹
        if (bookmarksData.favoriteBookmarks && Array.isArray(bookmarksData.favoriteBookmarks)) {
            total += bookmarksData.favoriteBookmarks.length;
        }
        // 分类
        if (bookmarksData.categories && Array.isArray(bookmarksData.categories)) {
            bookmarksData.categories.forEach(cat => {
                if (cat.bookmarks && Array.isArray(cat.bookmarks)) {
                    total += cat.bookmarks.length;
                }
            });
        }
    }
    return total;
}

// 初始化侧边栏
function initializeSidebar(categories) {
    const sidebar = document.querySelector('.sidebar');
    sidebar.innerHTML = ''; // 清空现有内容
    
    // 添加收藏分组标题
    const favoritesGroup = document.createElement('div');
    favoritesGroup.className = 'sidebar-group';
    favoritesGroup.textContent = '我的收藏';
    sidebar.appendChild(favoritesGroup);
    
    // 添加"我的导航"项
    const myNavItem = document.createElement('div');
    myNavItem.className = 'sidebar-item active';
    myNavItem.style.setProperty('--index', '0');
    
    const myNavIcon = document.createElement('div');
    myNavIcon.className = 'sidebar-icon';
    myNavIcon.style.background = '#E74C3C';
    myNavIcon.innerHTML = '<i class="fas fa-star"></i>';
    myNavIcon.textContent = '★';
    
    myNavItem.appendChild(myNavIcon);
    // "我的导航"后面加数量
    const favCountSpan = document.createElement('span');
    favCountSpan.className = 'category-count';
    favCountSpan.style.color = '#888';
    favCountSpan.style.marginLeft = '4px';
    favCountSpan.textContent =
        bookmarksData && bookmarksData.favoriteBookmarks ? `（${bookmarksData.favoriteBookmarks.length}）` : '（0）';
    myNavItem.appendChild(document.createTextNode('我的导航'));
    myNavItem.appendChild(favCountSpan);
    
    // 添加点击事件
    myNavItem.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // 滚动到"我的导航"区域
        const section = document.getElementById('category-我的导航');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    sidebar.appendChild(myNavItem);
    
    // 添加分类分组标题
    const categoriesGroup = document.createElement('div');
    categoriesGroup.className = 'sidebar-group';
    categoriesGroup.textContent = '分类导航';
    sidebar.appendChild(categoriesGroup);
    
    // 为每个分类创建侧边栏项
    categories.forEach((category, index) => {
        const sidebarItem = document.createElement('div');
        sidebarItem.className = 'sidebar-item';
        sidebarItem.style.setProperty('--index', `${index + 1}`);
        
        // 生成随机颜色或使用预设颜色
        const colors = ['#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E', '#F39C12', '#27AE60', '#8E44AD', '#2ECC71', '#E91E63', '#607D8B'];
        const colorIndex = index % colors.length;
        
        const sidebarIcon = document.createElement('div');
        sidebarIcon.className = 'sidebar-icon';
        sidebarIcon.style.background = colors[colorIndex];
        
        // 使用分类图标或首字母
        if (category.icon) {
            sidebarIcon.textContent = category.icon;
        } else {
            sidebarIcon.textContent = category.name.charAt(0);
        }
        
        sidebarItem.appendChild(sidebarIcon);
        
        // 创建分类名称容器
        const nameContainer = document.createElement('div');
        nameContainer.className = 'sidebar-name-container';
        nameContainer.style.flex = '1';
        nameContainer.style.display = 'flex';
        nameContainer.style.justifyContent = 'space-between';
        nameContainer.style.alignItems = 'center';
        
        // 添加分类名称
        nameContainer.appendChild(document.createTextNode(category.name));
        
        // 分类数量统计
        const catCountSpan = document.createElement('span');
        catCountSpan.className = 'category-count';
        catCountSpan.style.color = '#888';
        catCountSpan.style.marginLeft = '4px';
        catCountSpan.textContent =
            category.bookmarks && Array.isArray(category.bookmarks) ? `（${category.bookmarks.length}）` : '（0）';
        nameContainer.appendChild(catCountSpan);
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-delete-btn';
        deleteBtn.id = `delete-category-${index}`;
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '删除分类';
        deleteBtn.style.display = 'none'; // 默认隐藏
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#E74C3C';
        deleteBtn.style.fontSize = '16px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '0 5px';
        deleteBtn.style.marginLeft = '5px';
        
        // 添加删除按钮点击事件
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 确认删除
            if (confirm(`确定要删除分类"${category.name}"吗？\n该分类下的所有书签都将被删除。`)) {
                // 找到对应的分类区域
                const sectionId = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
                const section = document.getElementById(sectionId);
                
                if (section) {
                    // 添加删除动画
                    section.style.opacity = '0';
                    section.style.transform = 'scale(0.9)';
                    
                    // 动画结束后移除元素
                    setTimeout(() => {
                        section.remove();
                        sidebarItem.remove();
                        
                        // 如果有bookmarksData，更新数据
                        if (bookmarksData) {
                            // 找到分类索引
                            const categoryIndex = bookmarksData.categories.findIndex(cat => cat.name === category.name);
                            
                            if (categoryIndex !== -1) {
                                // 从数组中删除
                                bookmarksData.categories.splice(categoryIndex, 1);
                                
                                // 保存书签数据
                                saveBookmarksData();
                            }
                        }
                        
                        // 调整侧边栏高度
                        adjustSidebarHeight();
                        
                        // 显示成功提示
                        showToast(`已删除分类"${category.name}"`);
                    }, 300);
                }
            }
        });
        
        nameContainer.appendChild(deleteBtn);
        sidebarItem.appendChild(nameContainer);
        
        // 添加点击事件
        sidebarItem.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 滚动到对应的分类区域
            const sectionId = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        sidebar.appendChild(sidebarItem);
    });
}

// 初始化内容区域
function initializeContent(categories) {
    const content = document.querySelector('.content');
    content.innerHTML = ''; // 清空现有内容
    
    // 添加"我的导航"区域
    const myNavigationSection = document.createElement('section');
    myNavigationSection.className = 'section';
    myNavigationSection.id = 'category-我的导航';
    
    const myNavigationHeader = document.createElement('div');
    myNavigationHeader.className = 'section-header';
    
    const myNavigationTitle = document.createElement('div');
    myNavigationTitle.className = 'section-title';
    myNavigationTitle.textContent = '我的导航';
    
    myNavigationHeader.appendChild(myNavigationTitle);
    
    const myNavigationGrid = document.createElement('div');
    myNavigationGrid.className = 'website-grid';
    
    // 检查并显示收藏的书签
    if (bookmarksData && bookmarksData.favoriteBookmarks && bookmarksData.favoriteBookmarks.length > 0) {
        // 遍历收藏书签
        bookmarksData.favoriteBookmarks.forEach(bookmark => {
            // 创建网站卡片
            const card = document.createElement('div');
            card.className = 'website-card';
            card.dataset.url = bookmark.url;
            card.dataset.id = bookmark.id;
            
            // 创建图标
            const icon = document.createElement('div');
            icon.className = 'website-icon';
            icon.style.background = bookmark.iconColor || '#4285F4';
            icon.textContent = bookmark.icon || '🔗';
            
            // 创建信息区域
            const info = document.createElement('div');
            info.className = 'website-info';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'website-name';
            nameElement.textContent = bookmark.title;
            
            const descElement = document.createElement('div');
            descElement.className = 'website-desc';
            descElement.textContent = bookmark.desc || '';
            
            // 组装卡片
            info.appendChild(nameElement);
            info.appendChild(descElement);
            
            card.appendChild(icon);
            card.appendChild(info);
            
            // 创建按钮组
            createCardButtonGroup(card);
            
            // 添加点击事件
            card.addEventListener('click', function(e) {
                // 如果点击的是按钮，则不触发卡片点击事件
                if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn') ||
                    e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn') ||
                    e.target.classList.contains('move-btn') || e.target.closest('.move-btn') ||
                    e.target.classList.contains('card-btn-group') || e.target.closest('.card-btn-group')) {
                    return;
                }
                
                // 如果在编辑模式下，不执行卡片点击操作
                if (document.body.classList.contains('edit-mode')) {
                    return;
                }
                
                // 打开链接
                window.open(this.dataset.url, '_blank');
            });
            
            // 添加到网格
            myNavigationGrid.appendChild(card);
        });
    }
    
    myNavigationSection.appendChild(myNavigationHeader);
    myNavigationSection.appendChild(myNavigationGrid);
    
    content.appendChild(myNavigationSection);
    
    // 为每个分类创建内容区域
    categories.forEach(category => {
        const section = document.createElement('section');
        section.className = 'section';
        section.id = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        
        // 创建标题容器以便于添加按钮
        const titleContainer = document.createElement('div');
        titleContainer.className = 'section-title-container';
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.width = '100%';
        
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = category.name;
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'section-delete-btn';
        deleteBtn.id = `section-delete-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
        deleteBtn.innerHTML = '删除';
        deleteBtn.title = '删除分类';
        deleteBtn.style.display = 'none'; // 默认隐藏
        deleteBtn.style.background = '#E74C3C';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'white';
        deleteBtn.style.fontSize = '14px';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = '10px';
        
        // 添加删除按钮点击事件
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 确认删除
            if (confirm(`确定要删除分类"${category.name}"吗？\n该分类下的所有书签都将被删除。`)) {
                // 添加删除动画
                section.style.opacity = '0';
                section.style.transform = 'scale(0.9)';
                
                // 动画结束后移除元素
                setTimeout(() => {
                    section.remove();
                    
                    // 同时移除侧边栏对应项
                    const sidebarItems = document.querySelectorAll('.sidebar-item');
                    sidebarItems.forEach(item => {
                        if (item.textContent.includes(category.name)) {
                            item.remove();
                        }
                    });
                    
                    // 如果有bookmarksData，更新数据
                    if (bookmarksData) {
                        // 找到分类索引
                        const categoryIndex = bookmarksData.categories.findIndex(cat => cat.name === category.name);
                        
                        if (categoryIndex !== -1) {
                            // 从数组中删除
                            bookmarksData.categories.splice(categoryIndex, 1);
                            
                            // 保存书签数据
                            saveBookmarksData();
                        }
                    }
                    
                    // 调整侧边栏高度
                    adjustSidebarHeight();
                    
                    // 显示成功提示
                    showToast(`已删除分类"${category.name}"`);
                }, 300);
            }
        });
        
        titleContainer.appendChild(sectionTitle);
        titleContainer.appendChild(deleteBtn);
        sectionHeader.appendChild(titleContainer);
        
        const websiteGrid = document.createElement('div');
        websiteGrid.className = 'website-grid';
        
        // 添加书签
        if (category.bookmarks && category.bookmarks.length > 0) {
            category.bookmarks.forEach(bookmark => {
                // 创建网站卡片
                createWebsiteCard(
                    websiteGrid,
                    bookmark.title || '',
                    bookmark.description || '', // 使用描述字段
                    bookmark.url || '',
                    bookmark.icon || '', // 仍然传递图标文本，作为备用
                    null // 不再使用颜色
                );
            });
        }
        
        // 添加"添加网站"卡片
        addAddWebsiteCard(websiteGrid);
        
        section.appendChild(sectionHeader);
        section.appendChild(websiteGrid);
        
        content.appendChild(section);
    });
}

// 获取图标颜色
function getIconColor(icon) {
    // 根据图标emoji生成一致的颜色
    const colors = {
        '🔍': '#4285F4', // 搜索
        '⚙️': '#34A853', // 开发工具
        '📰': '#FBBC05', // 新闻
        '🛒': '#EA4335', // 购物
        '📁': '#607D8B', // 其他/文件
        '🎮': '#9C27B0', // 游戏
        '🎬': '#FF5722', // 视频
        '🎵': '#1DB954', // 音乐
        '📚': '#795548', // 书籍/学习
        '🖼️': '#E91E63', // 图片
        '🔧': '#00BCD4', // 工具
    };
    
    return colors[icon] || '#4285F4'; // 默认蓝色
}

// 侧边栏项目点击交互
document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// 网站卡片点击效果
document.querySelectorAll('.website-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // 如果点击的是删除按钮，则不触发卡片点击事件
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            return;
        }
        
        // 如果在编辑模式下，不执行卡片点击操作
        if (document.body.classList.contains('edit-mode')) {
            return;
        }
        
        console.log('点击了网站:', this.querySelector('.website-name').textContent);
    });
});

// 编辑模式切换
document.addEventListener('DOMContentLoaded', async () => {
    // 加载书签数据
    const data = await loadBookmarks();
    if (data) {
        // 初始化侧边栏和内容区域
        initializeSidebar(data.categories);
        initializeContent(data.categories);
        
        // 调整侧边栏高度
        adjustSidebarHeight();
        
        // 添加侧边栏滚动监听
        setupSidebarScroll();
        
        // 显示总书签数
        const totalCountSpan = document.getElementById('total-count');
        if (totalCountSpan) {
            totalCountSpan.textContent = `（${getTotalBookmarksCount()}）`;
        }
    }
    
    // 获取编辑模式按钮
    const editModeBtn = document.getElementById('edit-mode-btn');
    
    // 添加点击事件
    editModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('edit-mode');
        
        // 更新按钮文本
        const editIcon = editModeBtn.querySelector('span');
        if (document.body.classList.contains('edit-mode')) {
            editModeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            editIcon.textContent = '✓';
            editIcon.nextSibling.textContent = ' 完成编辑';
            
            // 显示所有卡片的按钮组
            document.querySelectorAll('.card-btn-group').forEach(btnGroup => {
                btnGroup.style.display = 'block'; // 修改为block而不是flex
            });
            
            // 为所有网站卡片添加按钮组
            document.querySelectorAll('.website-card').forEach(card => {
                // 确保卡片有按钮组
                createCardButtonGroup(card);
            });
            
            // 显示分类删除按钮（侧边栏）
            document.querySelectorAll('.category-delete-btn').forEach(btn => {
                btn.style.display = 'inline-block';
            });
            
            // 显示分类删除按钮（内容区域）
            document.querySelectorAll('.section-delete-btn').forEach(btn => {
                btn.style.display = 'inline-block';
            });
        } else {
            editModeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            editIcon.textContent = '✏️';
            editIcon.nextSibling.textContent = ' 编辑模式';
            
            // 隐藏所有卡片的按钮组
            document.querySelectorAll('.card-btn-group').forEach(btnGroup => {
                btnGroup.style.display = 'none';
            });
            
            // 隐藏分类删除按钮（侧边栏）
            document.querySelectorAll('.category-delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            
            // 隐藏分类删除按钮（内容区域）
            document.querySelectorAll('.section-delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    });
    
    // 添加分类按钮事件
    const addCategoryBtn = document.getElementById('add-category-btn');
    addCategoryBtn.addEventListener('click', () => {
        // 弹出输入框
        const categoryName = prompt('请输入新分类名称:');
        
        // 如果用户取消或输入为空，则不执行后续操作
        if (!categoryName || categoryName.trim() === '') {
            return;
        }
        
        // 创建新的分类
        createNewCategory(categoryName);
        
        // 调整侧边栏高度
        adjustSidebarHeight();
    });
    
    // 为现有的网站卡片添加收藏按钮
    document.querySelectorAll('.website-card').forEach(card => {
        addFavoriteButton(card);
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            
            const card = this.closest('.website-card');
            const siteName = card.querySelector('.website-name').textContent;
            
            // 防止重复弹窗
            if (isDeleteConfirmShowing) {
                return;
            }
            
            // 设置确认弹窗显示状态
            isDeleteConfirmShowing = true;
            
            // 确认删除
            if (confirm(`确定要删除"${siteName}"吗？`)) {
                // 添加删除动画
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                // 动画结束后移除元素
                setTimeout(() => {
                    card.remove();
                }, 300);
            }
            
            // 重置确认弹窗状态
            setTimeout(() => {
                isDeleteConfirmShowing = false;
            }, 100);
        });
    });

    // 添加配置按钮事件
    const configBtn = document.getElementById('github-config-btn');
    configBtn.addEventListener('click', () => {
        showGitHubConfigModal();
    });

    // 添加检测失效链接按钮事件
    const checkDeadLinksBtn = document.querySelector('.header-btn:nth-child(5)');
    checkDeadLinksBtn.addEventListener('click', () => {
        checkDeadLinks();
    });
    
    // 添加同步到GitHub按钮事件
    const syncGithubBtn = document.querySelector('.header-btn:nth-child(2)');
    syncGithubBtn.addEventListener('click', () => {
        // 保存书签数据到本地
        saveBookmarksData();
        
        // 同步到GitHub
        syncToGitHub();
    });
    
    // 修改备份/恢复按钮为"从GitHub更新"
    const updateFromGithubBtn = document.querySelector('.header-btn:nth-child(3)');
    updateFromGithubBtn.innerHTML = '<span style="margin-right: 5px;">⬇️</span> 从 GitHub 更新';
    updateFromGithubBtn.addEventListener('click', () => {
        downloadFromGitHub();
    });
    
    // 添加更新图标按钮事件
    const updateIconsBtn = document.querySelector('.header-btn:nth-child(6)');
    updateIconsBtn.addEventListener('click', () => {
        updateAllIcons();
    });

    // 添加导入书签按钮事件
    const importBookmarksBtn = document.querySelector('.header-btn:nth-child(4)');
    importBookmarksBtn.addEventListener('click', () => {
        importBookmarksFromHTML();
    });

    // 设置添加网站弹窗相关事件
    setupAddWebsiteModal();

    // Header 滚动悬浮效果
    const header = document.querySelector('.header');
    const headerHeight = header.offsetHeight;
    const searchSection = document.querySelector('.search-section');
    
    // 计算初始位置
    let headerInitialPosition = header.offsetHeight;
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (window.scrollY > headerInitialPosition) {
            header.classList.add('sticky');
            // 添加占位空间，防止内容跳动
            if (!document.querySelector('.header-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.classList.add('header-placeholder');
                placeholder.style.height = `${headerHeight}px`;
                document.body.insertBefore(placeholder, searchSection);
            }
        } else {
            header.classList.remove('sticky');
            // 移除占位空间
            const placeholder = document.querySelector('.header-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
        }
        
        // 调整侧边栏高度
        adjustSidebarHeight();
    });
    
    // 窗口大小改变时重新计算位置和侧边栏高度
    window.addEventListener('resize', () => {
        headerInitialPosition = header.offsetHeight;
        adjustSidebarHeight();
    });
});

// 设置侧边栏滚动效果
function setupSidebarScroll() {
    const sidebar = document.querySelector('.sidebar');
    
    // 添加鼠标进入事件
    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.add('hover-active');
    });
    
    // 添加鼠标离开事件
    sidebar.addEventListener('mouseleave', () => {
        sidebar.classList.remove('hover-active');
    });
    
    // 监听滚动事件
    sidebar.addEventListener('scroll', () => {
        // 检查是否滚动到底部
        const isAtBottom = sidebar.scrollHeight - sidebar.scrollTop - sidebar.clientHeight < 10;
        
        // 如果滚动到底部，隐藏滚动指示器
        if (isAtBottom) {
            sidebar.classList.add('at-bottom');
        } else {
            sidebar.classList.remove('at-bottom');
        }
    });
}

// 调整侧边栏高度
function adjustSidebarHeight() {
    const sidebar = document.querySelector('.sidebar');
    
    // 如果在移动视图下，不需要调整高度
    if (window.innerWidth <= 768) {
        sidebar.style.height = 'auto';
        return;
    }
    
    // 计算可用的最大高度
    const headerHeight = document.querySelector('.header').offsetHeight;
    const maxHeight = window.innerHeight - headerHeight;
    
    // 计算侧边栏内容的实际高度
    const sidebarItems = sidebar.querySelectorAll('.sidebar-item, .sidebar-group');
    let totalHeight = 0;
    
    // 计算所有项目的总高度
    sidebarItems.forEach(item => {
        const style = window.getComputedStyle(item);
        const marginTop = parseFloat(style.marginTop);
        const marginBottom = parseFloat(style.marginBottom);
        totalHeight += item.offsetHeight + marginTop + marginBottom;
    });
    
    // 添加顶部和底部内边距
    const paddingTop = parseFloat(window.getComputedStyle(sidebar).paddingTop);
    const paddingBottom = 20; // 底部额外内边距
    
    totalHeight += paddingTop + paddingBottom;
    
    // 设置侧边栏高度，但不超过最大高度
    const finalHeight = Math.min(totalHeight, maxHeight);
    sidebar.style.height = `${finalHeight}px`;
    
    // 如果内容高度超过可视区域，添加滚动指示器
    if (totalHeight > maxHeight) {
        sidebar.classList.add('scrollable');
    } else {
        sidebar.classList.remove('scrollable');
    }
}

// 为卡片添加收藏按钮
function addFavoriteButton(card) {
    // 确保卡片有按钮组
    createCardButtonGroup(card);
}

// 为网站卡片添加移动按钮
function addMoveButton(card) {
    // 确保卡片有按钮组
    createCardButtonGroup(card);
}

// 创建网站卡片
function createWebsiteCard(grid, name, desc, url, iconText, iconColor) {
    // 创建卡片元素
    const card = document.createElement('div');
    card.className = 'website-card';
    card.dataset.url = url;
    
    // 创建图标
    const icon = document.createElement('div');
    icon.className = 'website-icon';
    
    // 尝试使用缓存中的favicon或默认图标
    try {
        const domain = new URL(url).hostname;
        // 尝试从localStorage获取缓存的图标
        const cachedIcon = getIconFromCache(domain);
        
        if (cachedIcon) {
            // 使用缓存的图标
            if (cachedIcon.type === 'url') {
                // 创建图片元素
                const img = document.createElement('img');
                img.className = 'favicon-img';
                img.alt = name.charAt(0);
                img.src = cachedIcon.data;
                img.style.display = 'block';
                icon.style.background = 'white';
                icon.dataset.useDefault = 'false';
                icon.appendChild(img);
            } else {
                // 使用默认文字图标
                icon.style.background = iconColor || '#4285F4';
                icon.textContent = iconText || name.charAt(0);
                icon.dataset.useDefault = 'true';
            }
        } else {
            // 如果没有缓存，使用默认文字图标
            icon.style.background = iconColor || '#4285F4';
            icon.textContent = iconText || name.charAt(0);
            icon.dataset.useDefault = 'true';
        }
    } catch (error) {
        // 如果URL解析失败，使用文字图标
        icon.style.background = iconColor || '#4285F4';
        icon.textContent = iconText || name.charAt(0);
        icon.dataset.useDefault = 'true';
    }
    
    // 创建信息区域
    const info = document.createElement('div');
    info.className = 'website-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'website-name';
    nameElement.textContent = name;
    
    const descElement = document.createElement('div');
    descElement.className = 'website-desc';
    descElement.textContent = desc || '';
    
    // 组装卡片
    info.appendChild(nameElement);
    info.appendChild(descElement);
    
    card.appendChild(icon);
    card.appendChild(info);
    
    // 创建按钮组容器
    createCardButtonGroup(card);
    
    // 添加点击事件
    card.addEventListener('click', function(e) {
        // 如果点击的是按钮，则不触发卡片点击事件
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn') ||
            e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn') ||
            e.target.classList.contains('move-btn') || e.target.closest('.move-btn') ||
            e.target.classList.contains('card-btn-group') || e.target.closest('.card-btn-group')) {
            return;
        }
        
        // 如果在编辑模式下，不执行卡片点击操作
        if (document.body.classList.contains('edit-mode')) {
            return;
        }
        
        // 打开链接
        window.open(this.dataset.url, '_blank');
    });
    
    // 插入到添加按钮之前
    const addCard = grid.querySelector('.add-website-card');
    grid.insertBefore(card, addCard);
    
    // 调整侧边栏高度
    adjustSidebarHeight();
    
    return card;
}

// 添加到我的导航
function addToMyNavigation(name, desc, url, iconText, iconColor) {
    // 获取我的导航区域
    let myNavigationSection = document.querySelector('.section:first-child');
    let myNavigationGrid = myNavigationSection.querySelector('.website-grid');
    
    // 如果没有网格，创建一个
    if (!myNavigationGrid) {
        myNavigationGrid = document.createElement('div');
        myNavigationGrid.className = 'website-grid';
        myNavigationSection.appendChild(myNavigationGrid);
    }
    
    // 移除可能存在的空白提示
    const emptyMessage = myNavigationGrid.querySelector('div[style*="text-align: center"]');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 检查是否已经存在相同URL的卡片
    const existingCards = Array.from(myNavigationGrid.querySelectorAll('.website-card'));
    const existingCard = existingCards.find(card => card.dataset.url === url);
    
    if (existingCard) {
        // 如果已存在，显示提示
        showToast(`"${name}"已在我的导航中`);
        return;
    }
    
    // 创建新的网站卡片并添加到我的导航
    const card = document.createElement('div');
    card.className = 'website-card';
    card.dataset.url = url;
    
    // 生成唯一ID
    const bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    card.dataset.id = bookmarkId;
    
    // 创建图标
    const icon = document.createElement('div');
    icon.className = 'website-icon';
    icon.style.background = iconColor;
    icon.textContent = iconText;
    
    // 创建信息区域
    const info = document.createElement('div');
    info.className = 'website-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'website-name';
    nameElement.textContent = name;
    
    const descElement = document.createElement('div');
    descElement.className = 'website-desc';
    descElement.textContent = desc || '';
    
    // 组装卡片
    info.appendChild(nameElement);
    info.appendChild(descElement);
    
    card.appendChild(icon);
    card.appendChild(info);
    
    // 创建按钮组
    createCardButtonGroup(card);
    
    // 添加点击事件
    card.addEventListener('click', function(e) {
        // 如果点击的是按钮，则不触发卡片点击事件
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn') ||
            e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn') ||
            e.target.classList.contains('move-btn') || e.target.closest('.move-btn') ||
            e.target.classList.contains('card-btn-group') || e.target.closest('.card-btn-group')) {
            return;
        }
        
        // 如果在编辑模式下，不执行卡片点击操作
        if (document.body.classList.contains('edit-mode')) {
            return;
        }
        
        // 打开链接
        window.open(this.dataset.url, '_blank');
    });
    
    // 添加到网格
    myNavigationGrid.appendChild(card);
    
    // 调整侧边栏高度
    adjustSidebarHeight();
    
    // 保存到 bookmarksData.favoriteBookmarks
    if (bookmarksData) {
        // 确保 favoriteBookmarks 存在
        if (!bookmarksData.favoriteBookmarks) {
            bookmarksData.favoriteBookmarks = [];
        }
        
        // 添加书签数据
        bookmarksData.favoriteBookmarks.push({
            id: bookmarkId,
            title: name,
            url: url,
            desc: desc || '',
            icon: iconText,
            iconColor: iconColor
        });
        
        // 更新同步状态
        if (bookmarksData.metadata) {
            bookmarksData.metadata.syncStatus = "unsaved";
        }
        
        // 保存书签数据
        saveBookmarksData();
    }
}

// 显示提示信息
function showToast(message) {
    // 检查是否已存在toast元素
    let toast = document.querySelector('.toast-message');
    
    // 如果不存在，创建一个
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
        
        // 添加样式
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '3000';
        toast.style.transition = 'opacity 0.3s ease';
    }
    
    // 设置消息内容
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// 保存书签数据到本地
function saveBookmarksData() {
    if (bookmarksData) {
        try {
            // 更新最后修改时间
            if (bookmarksData.metadata) {
                bookmarksData.metadata.lastUpdated = new Date().toISOString();
            }
            
            // 保存到本地存储
            localStorage.setItem('bookmarksData', JSON.stringify(bookmarksData));
            
            console.log('书签数据已保存到本地');
        } catch (error) {
            console.error('保存书签数据失败:', error);
        }
    }
}

// 创建新分类函数
function createNewCategory(categoryName) {
    // 创建新的分类区域
    const section = document.createElement('section');
    section.className = 'section';
    section.id = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
    
    // 创建分类标题
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = categoryName;
    
    sectionHeader.appendChild(sectionTitle);
    
    // 创建网站卡片容器
    const websiteGrid = document.createElement('div');
    websiteGrid.className = 'website-grid';
    
    // 添加"添加网站"卡片
    addAddWebsiteCard(websiteGrid);
    
    // 组装分类区域
    section.appendChild(sectionHeader);
    section.appendChild(websiteGrid);
    
    // 添加到主内容区域
    const content = document.querySelector('.content');
    content.appendChild(section);
    
    // 添加到侧边栏
    addCategoryToSidebar(categoryName);
    
    // 滚动到新添加的分类
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth' });
        
        // 调整侧边栏高度
        adjustSidebarHeight();
    }, 100);
    
    // 更新 bookmarksData
    if (bookmarksData) {
        // 创建新分类对象
        const newCategory = {
            name: categoryName,
            icon: "📁", // 默认图标
            bookmarks: []
        };
        
        // 添加到分类列表
        bookmarksData.categories.push(newCategory);
        
        // 添加到自定义分类列表
        if (!bookmarksData.customCategories) {
            bookmarksData.customCategories = [];
        }
        bookmarksData.customCategories.push({
            name: categoryName,
            icon: "📁"
        });
        
        // 标记为未同步
        if (bookmarksData.metadata) {
            bookmarksData.metadata.syncStatus = "unsaved";
        }
        
        // 保存书签数据
        saveBookmarksData();
    }
    
    return section;
}

// 添加分类到侧边栏
function addCategoryToSidebar(categoryName) {
    const sidebar = document.querySelector('.sidebar');
    
    // 获取最后一个侧边栏项目的索引
    const sidebarItems = sidebar.querySelectorAll('.sidebar-item');
    const lastIndex = sidebarItems.length;
    
    // 创建新的侧边栏项目
    const sidebarItem = document.createElement('div');
    sidebarItem.className = 'sidebar-item';
    sidebarItem.style.setProperty('--index', `${lastIndex}`);
    
    // 生成随机颜色或使用预设颜色
    const colors = ['#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E', '#F39C12', '#27AE60', '#8E44AD', '#2ECC71', '#E91E63', '#607D8B'];
    const colorIndex = lastIndex % colors.length;
    
    const sidebarIcon = document.createElement('div');
    sidebarIcon.className = 'sidebar-icon';
    sidebarIcon.style.background = colors[colorIndex];
    sidebarIcon.textContent = categoryName.charAt(0);
    
    sidebarItem.appendChild(sidebarIcon);
    sidebarItem.appendChild(document.createTextNode(categoryName));
    
    // 添加点击事件
    sidebarItem.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // 滚动到对应的分类区域
        const sectionId = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // 添加到侧边栏
    sidebar.appendChild(sidebarItem);
}

// 添加"添加网站"卡片
function addAddWebsiteCard(websiteGrid) {
    // 移除可能存在的空白提示
    const emptyMessage = websiteGrid.querySelector('div[style*="text-align: center"]');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 创建添加网站卡片
    const addCard = document.createElement('div');
    addCard.className = 'add-website-card';
    addCard.innerHTML = '<div class="plus-icon">+</div>';
    
    // 添加点击事件
    addCard.addEventListener('click', function() {
        // 打开添加网站弹窗
        openAddWebsiteModal(websiteGrid);
    });
    
    // 添加到网格
    websiteGrid.appendChild(addCard);
}

// 设置添加网站弹窗
function setupAddWebsiteModal() {
    const modal = document.getElementById('addWebsiteModal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const submitBtn = modal.querySelector('.submit-btn');
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
        closeModal();
    });
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        closeModal();
    });
    
    // 提交按钮事件
    submitBtn.addEventListener('click', () => {
        const websiteName = document.getElementById('website-name').value.trim();
        const websiteUrl = document.getElementById('website-url').value.trim();
        const websiteDesc = document.getElementById('website-desc').value.trim();
        
        // 验证必填字段
        if (!websiteName) {
            alert('请输入网站名称');
            return;
        }
        
        if (!websiteUrl) {
            alert('请输入网站链接');
            return;
        }
        
        // 如果URL不包含协议，添加https://
        let finalUrl = websiteUrl;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        
        // 创建新网站卡片
        const card = createWebsiteCard(
            modal.targetGrid, 
            websiteName, 
            websiteDesc, 
            finalUrl, 
            null, // 不再使用图标文字
            null  // 不再使用图标颜色
        );
        
        // 更新 bookmarksData
        if (bookmarksData) {
            // 找到当前分类
            const sectionElement = modal.targetGrid.closest('.section');
            const categoryName = sectionElement.querySelector('.section-title').textContent;
            
            // 查找分类索引
            const categoryIndex = bookmarksData.categories.findIndex(cat => cat.name === categoryName);
            
            if (categoryIndex !== -1) {
                // 创建新书签对象
                const newBookmark = {
                    id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: websiteName,
                    url: finalUrl,
                    description: websiteDesc || '',
                    isFavorite: false
                };
                
                // 添加到分类的书签列表
                bookmarksData.categories[categoryIndex].bookmarks.push(newBookmark);
                
                // 标记为未同步
                if (bookmarksData.metadata) {
                    bookmarksData.metadata.syncStatus = "unsaved";
                }
                
                // 保存书签数据
                saveBookmarksData();
            }
        }
        
        // 关闭弹窗
        closeModal();
        
        // 调整侧边栏高度
        adjustSidebarHeight();
    });
    
    // 关闭弹窗函数
    function closeModal() {
        modal.classList.remove('active');
        
        // 清空表单
        document.getElementById('website-name').value = '';
        document.getElementById('website-url').value = '';
        document.getElementById('website-desc').value = '';
    }
}

// 打开添加网站弹窗
function openAddWebsiteModal(targetGrid) {
    const modal = document.getElementById('addWebsiteModal');
    modal.targetGrid = targetGrid;
    modal.classList.add('active');
    
    // 聚焦到第一个输入框
    setTimeout(() => {
        document.getElementById('website-name').focus();
    }, 100);
}

// 检测失效链接
async function checkDeadLinks() {
    // 显示检测进度弹窗
    showCheckingModal();
    
    // 获取所有网站卡片
    const cards = document.querySelectorAll('.website-card');
    let totalLinks = cards.length;
    let checkedLinks = 0;
    let deadLinks = 0;
    let deadLinkCards = [];
    
    // 更新进度信息
    updateCheckingProgress(checkedLinks, totalLinks, deadLinks);
    
    // 检测每个链接
    for (const card of cards) {
        const url = card.dataset.url;
        const name = card.querySelector('.website-name').textContent;
        
        if (!url) {
            checkedLinks++;
            updateCheckingProgress(checkedLinks, totalLinks, deadLinks);
            continue;
        }
        
        try {
            const isAlive = await checkLinkStatus(url);
            
            if (!isAlive) {
                // 标记失效链接
                card.classList.add('dead-link');
                deadLinks++;
                deadLinkCards.push(card);
            }
        } catch (error) {
            console.error(`检查链接 ${url} 时出错:`, error);
            // 标记为失效链接
            card.classList.add('dead-link');
            deadLinks++;
            deadLinkCards.push(card);
        }
        
        checkedLinks++;
        updateCheckingProgress(checkedLinks, totalLinks, deadLinks);
    }
    
    // 检测完成后关闭进度弹窗
    closeCheckingModal();
    
    // 显示检测结果
    if (deadLinks > 0) {
        showDeadLinksResult(deadLinkCards, deadLinks, totalLinks);
    } else {
        showToast('检测完成，所有链接均正常');
    }
}

// 检查链接状态
async function checkLinkStatus(url) {
    try {
        // 由于浏览器的跨域限制，我们无法直接检查外部链接
        // 这里我们使用一个简单的方法：创建一个图片元素并尝试加载目标网站的favicon
        // 如果能够加载成功，则认为网站可能是活跃的
        // 这不是100%准确，但可以作为前端检测的一种方法
        
        // 提取域名
        let domain;
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            console.error(`无效的URL: ${url}`);
            return false;
        }
        
        // 创建一个Promise来检测图片加载
        return new Promise((resolve) => {
            const img = new Image();
            
            // 设置超时
            const timeout = setTimeout(() => {
                img.src = '';  // 停止加载
                resolve(false);
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                // 尝试直接检查网站本身
                checkWebsiteDirectly(url).then(resolve).catch(() => resolve(false));
            };
            
            // 尝试加载网站的favicon
            img.src = `https://${domain}/favicon.ico`;
            
            // 如果图片已经被缓存，可能不会触发onload
            if (img.complete) {
                clearTimeout(timeout);
                resolve(true);
            }
        });
    } catch (error) {
        console.error(`检查链接 ${url} 时出错:`, error);
        return false;
    }
}

// 直接检查网站
async function checkWebsiteDirectly(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    resolve(true);
                } else {
                    reject(new Error(`HTTP状态: ${xhr.status}`));
                }
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('网络请求失败'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('请求超时'));
        };
        
        try {
            xhr.open('HEAD', url, true);
            xhr.timeout = 5000;
            xhr.send();
        } catch (e) {
            reject(e);
        }
    });
}

// 显示检测进度弹窗
function showCheckingModal() {
    // 检查是否已存在弹窗
    let modal = document.getElementById('checkingModal');
    
    if (!modal) {
        // 创建弹窗
        modal = document.createElement('div');
        modal.id = 'checkingModal';
        modal.className = 'checking-modal';
        
        // 弹窗内容
        modal.innerHTML = `
            <div class="checking-content">
                <div class="checking-title">正在检测链接有效性</div>
                <div class="progress-container">
                    <div class="progress-bar" id="checkingProgress"></div>
                </div>
                <div class="checking-info" id="checkingInfo">检测中: 0/0 (失效: 0)</div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .checking-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            }
            
            .checking-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
            }
            
            .checking-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .progress-container {
                height: 10px;
                background-color: #f0f0f0;
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .progress-bar {
                height: 100%;
                background-color: #E74C3C;
                width: 0%;
                transition: width 0.3s;
            }
            
            .checking-info {
                text-align: center;
                font-size: 14px;
                color: #666;
            }
            
            .dead-link {
                position: relative;
                opacity: 0.6;
            }
            
            .dead-link::after {
                content: "失效";
                position: absolute;
                top: 0;
                right: 0;
                background-color: #E74C3C;
                color: white;
                padding: 2px 8px;
                font-size: 12px;
                border-radius: 0 0 0 8px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
}

// 更新检测进度
function updateCheckingProgress(checked, total, dead) {
    const progressBar = document.getElementById('checkingProgress');
    const infoText = document.getElementById('checkingInfo');
    
    if (progressBar && infoText) {
        const percentage = (checked / total) * 100;
        progressBar.style.width = `${percentage}%`;
        infoText.textContent = `检测中: ${checked}/${total} (失效: ${dead})`;
    }
}

// 关闭检测进度弹窗
function closeCheckingModal() {
    const modal = document.getElementById('checkingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示失效链接结果
function showDeadLinksResult(deadLinkCards, deadCount, totalCount) {
    // 创建结果弹窗
    const modal = document.createElement('div');
    modal.className = 'dead-links-modal';
    
    // 弹窗内容
    modal.innerHTML = `
        <div class="dead-links-content">
            <div class="dead-links-header">
                <div class="dead-links-title">检测结果</div>
                <button class="close-dead-links-modal">&times;</button>
            </div>
            <div class="dead-links-summary">
                发现 ${deadCount} 个失效链接（共 ${totalCount} 个链接）
            </div>
            <div class="dead-links-list"></div>
            <div class="dead-links-actions">
                <button class="dead-links-btn remove-all-btn">删除所有失效链接</button>
                <button class="dead-links-btn close-btn">关闭</button>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .dead-links-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        }
        
        .dead-links-content {
            background-color: white;
            border-radius: 8px;
            width: 600px;
            max-width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        
        .dead-links-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .dead-links-title {
            font-size: 18px;
            font-weight: bold;
        }
        
        .close-dead-links-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        
        .dead-links-summary {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            color: #E74C3C;
        }
        
        .dead-links-list {
            padding: 10px 20px;
            overflow-y: auto;
            max-height: 300px;
            flex-grow: 1;
        }
        
        .dead-link-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .dead-link-info {
            flex-grow: 1;
        }
        
        .dead-link-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .dead-link-url {
            font-size: 12px;
            color: #666;
            word-break: break-all;
        }
        
        .dead-link-actions {
            display: flex;
            gap: 10px;
        }
        
        .dead-link-btn {
            background: none;
            border: none;
            color: #3498DB;
            cursor: pointer;
            padding: 5px;
        }
        
        .dead-link-btn:hover {
            text-decoration: underline;
        }
        
        .dead-links-actions {
            padding: 15px 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .dead-links-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .remove-all-btn {
            background-color: #E74C3C;
            color: white;
        }
        
        .close-btn {
            background-color: #f0f0f0;
            color: #333;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 获取失效链接列表容器
    const listContainer = modal.querySelector('.dead-links-list');
    
    // 添加失效链接项
    deadLinkCards.forEach(card => {
        const name = card.querySelector('.website-name').textContent;
        const url = card.dataset.url;
        
        const item = document.createElement('div');
        item.className = 'dead-link-item';
        
        item.innerHTML = `
            <div class="dead-link-info">
                <div class="dead-link-name">${name}</div>
                <div class="dead-link-url">${url}</div>
            </div>
            <div class="dead-link-actions">
                <button class="dead-link-btn retry-btn">重试</button>
                <button class="dead-link-btn remove-btn">删除</button>
            </div>
        `;
        
        // 添加重试按钮事件
        const retryBtn = item.querySelector('.retry-btn');
        retryBtn.addEventListener('click', async () => {
            retryBtn.textContent = '检测中...';
            retryBtn.disabled = true;
            
            try {
                const isAlive = await checkLinkStatus(url);
                
                if (isAlive) {
                    // 链接恢复正常
                    card.classList.remove('dead-link');
                    item.remove();
                    showToast(`链接 "${name}" 已恢复正常`);
                    
                    // 更新失效链接计数
                    const summary = modal.querySelector('.dead-links-summary');
                    const currentDeadCount = deadLinkCards.length - 1;
                    summary.textContent = `发现 ${currentDeadCount} 个失效链接（共 ${totalCount} 个链接）`;
                    
                    // 如果没有失效链接了，关闭弹窗
                    if (currentDeadCount === 0) {
                        modal.remove();
                        showToast('所有链接均已恢复正常');
                    }
                    
                    // 调整侧边栏高度
                    adjustSidebarHeight();
                } else {
                    retryBtn.textContent = '重试';
                    retryBtn.disabled = false;
                    showToast(`链接 "${name}" 仍然失效`);
                }
            } catch (error) {
                console.error(`重试检查链接 ${url} 时出错:`, error);
                retryBtn.textContent = '重试';
                retryBtn.disabled = false;
                showToast(`检查链接 "${name}" 时出错`);
            }
        });
        
        // 添加删除按钮事件
        const removeBtn = item.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            // 确认删除
            if (confirm(`确定要删除失效链接 "${name}" 吗？`)) {
                // 添加删除动画
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                // 动画结束后移除元素
                setTimeout(() => {
                    card.remove();
                    item.remove();
                    
                    // 更新失效链接计数
                    const remainingItems = modal.querySelectorAll('.dead-link-item').length;
                    const summary = modal.querySelector('.dead-links-summary');
                    summary.textContent = `发现 ${remainingItems} 个失效链接（共 ${totalCount} 个链接）`;
                    
                    // 如果没有失效链接了，关闭弹窗
                    if (remainingItems === 0) {
                        modal.remove();
                        showToast('所有失效链接已处理完毕');
                    }
                    
                    // 调整侧边栏高度
                    adjustSidebarHeight();
                }, 300);
            }
        });
        
        listContainer.appendChild(item);
    });
    
    // 添加关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // 添加关闭图标事件
    const closeIcon = modal.querySelector('.close-dead-links-modal');
    closeIcon.addEventListener('click', () => {
        modal.remove();
    });
    
    // 添加删除所有按钮事件
    const removeAllBtn = modal.querySelector('.remove-all-btn');
    removeAllBtn.addEventListener('click', () => {
        // 确认删除所有
        if (confirm(`确定要删除所有 ${deadCount} 个失效链接吗？`)) {
            // 删除所有失效链接卡片
            deadLinkCards.forEach(card => {
                // 添加删除动画
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                // 动画结束后移除元素
                setTimeout(() => {
                    card.remove();
                }, 300);
            });
            
            // 关闭弹窗
            modal.remove();
            showToast(`已删除 ${deadCount} 个失效链接`);
            
            // 调整侧边栏高度
            adjustSidebarHeight();
        }
    });
}

// 保存书签数据到文件
async function saveBookmarksToFile() {
    if (!bookmarksData) {
        showToast('没有书签数据可保存');
        return;
    }
    
    try {
        // 更新同步状态
        if (bookmarksData.metadata) {
            bookmarksData.metadata.syncStatus = "synced";
            bookmarksData.metadata.lastSynced = new Date().toISOString();
        }
        
        // 保存到本地存储
        localStorage.setItem('bookmarksData', JSON.stringify(bookmarksData));
        
        // 将数据转换为JSON字符串
        const jsonData = JSON.stringify(bookmarksData, null, 2);
        
        // 创建Blob对象
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'bookmarks.json';
        
        // 添加到文档并触发点击
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // 清理
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        
        showToast('书签数据已成功保存到文件');
    } catch (error) {
        console.error('保存书签数据到文件失败:', error);
        showToast('保存失败，请稍后重试');
    }
}

// 同步书签数据到GitHub
async function syncToGitHub() {
    if (!bookmarksData) {
        showToast('没有书签数据可同步');
        return;
    }
    
    // 检查GitHub配置
    if (!bookmarksData.settings || !bookmarksData.settings.github || 
        !bookmarksData.settings.github.configured || 
        !bookmarksData.settings.github.username || 
        !bookmarksData.settings.github.repository || 
        !bookmarksData.settings.github.token) {
        showGitHubConfigModal();
        return;
    }
    
    try {
        // 显示同步中提示
        showToast('正在同步到GitHub...');
        
        // 获取GitHub配置
        const { username, repository, token } = bookmarksData.settings.github;
        
        // 准备要上传的数据
        const jsonData = JSON.stringify(bookmarksData, null, 2);
        
        // 检查文件是否存在并获取SHA（如果存在）
        const fileInfo = await getGitHubFileInfo(username, repository, 'bookmarks.json', token);
        
        // 上传文件
        await uploadToGitHub(
            username, 
            repository, 
            'bookmarks.json', 
            jsonData, 
            '更新书签数据', 
            fileInfo ? fileInfo.sha : null, 
            token
        );
        
        // 更新同步状态
        if (bookmarksData.metadata) {
            bookmarksData.metadata.syncStatus = "synced";
            bookmarksData.metadata.lastSynced = new Date().toISOString();
        }
        
        // 保存到本地存储
        localStorage.setItem('bookmarksData', JSON.stringify(bookmarksData));
        
        showToast('书签已成功同步到GitHub');
    } catch (error) {
        console.error('同步到GitHub失败:', error);
        showToast('同步失败: ' + (error.message || '请检查网络和权限'));
    }
}

// 获取GitHub文件信息
async function getGitHubFileInfo(owner, repo, path, token) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.status === 404) {
            // 文件不存在
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`GitHub API 错误: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取GitHub文件信息失败:', error);
        return null;
    }
}

// 上传文件到GitHub
async function uploadToGitHub(owner, repo, path, content, message, sha, token) {
    // 处理内容，移除敏感信息
    let safeContent = content;
    try {
        // 解析JSON内容
        const jsonData = JSON.parse(content);
        
        // 移除token敏感信息
        if (jsonData.settings && jsonData.settings.github && jsonData.settings.github.token) {
            delete jsonData.settings.github.token;
        }
        
        // 转回字符串
        safeContent = JSON.stringify(jsonData, null, 2);
    } catch (error) {
        console.warn('内容不是有效的JSON或处理过程中出错:', error);
        // 保持原内容不变
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(safeContent))), // Base64编码
            sha: sha // 如果文件已存在，需要提供SHA
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API 错误: ${response.status} - ${errorData.message}`);
    }
    
    return await response.json();
}

// 从GitHub下载书签数据
async function downloadFromGitHub() {
    if (!bookmarksData || !bookmarksData.settings || !bookmarksData.settings.github || 
        !bookmarksData.settings.github.configured || 
        !bookmarksData.settings.github.username || 
        !bookmarksData.settings.github.repository || 
        !bookmarksData.settings.github.token) {
        showGitHubConfigModal();
        return;
    }
    
    try {
        // 显示下载中提示
        showToast('正在从GitHub获取数据...');
        
        // 获取GitHub配置
        const { username, repository, token } = bookmarksData.settings.github;
        
        // 获取文件信息
        const fileInfo = await getGitHubFileInfo(username, repository, 'bookmarks.json', token);
        
        if (!fileInfo) {
            throw new Error('在GitHub上找不到书签文件');
        }
        
        // 获取文件内容
        const response = await fetch(fileInfo.download_url);
        if (!response.ok) {
            throw new Error(`下载文件失败: ${response.status}`);
        }
        
        const remoteData = await response.json();
        
        // 保存本地的token信息
        const localToken = bookmarksData.settings?.github?.token;
        
        // 更新本地数据
        bookmarksData = remoteData;
        
        // 恢复token信息
        if (localToken && bookmarksData.settings && bookmarksData.settings.github) {
            bookmarksData.settings.github.token = localToken;
        }
        
        // 保存到本地存储
        localStorage.setItem('bookmarksData', JSON.stringify(bookmarksData));
        
        // 重新初始化界面
        document.querySelector('.content').innerHTML = '';
        document.querySelector('.sidebar').innerHTML = '';
        
        // 重新初始化侧边栏和内容区域
        initializeSidebar(bookmarksData.categories);
        initializeContent(bookmarksData.categories);
        
        // 调整侧边栏高度
        adjustSidebarHeight();
        
        // 添加侧边栏滚动监听
        setupSidebarScroll();
        
        showToast('已成功从GitHub更新书签数据');
    } catch (error) {
        console.error('从GitHub下载数据失败:', error);
        showToast('更新失败: ' + (error.message || '请检查网络和权限'));
    }
}

// 显示GitHub配置弹窗
function showGitHubConfigModal() {
    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'githubConfigModal';
    
    // 获取现有的GitHub配置
    const githubConfig = bookmarksData && bookmarksData.settings && bookmarksData.settings.github ? 
                        bookmarksData.settings.github : 
                        { username: '', repository: '', token: '', configured: false };
    
    // 弹窗内容
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">GitHub配置</div>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-form">
                <div class="form-group">
                    <label for="github-username">GitHub用户名</label>
                    <input type="text" id="github-username" placeholder="输入GitHub用户名" value="${githubConfig.username || ''}">
                </div>
                <div class="form-group">
                    <label for="github-repo">仓库名称</label>
                    <input type="text" id="github-repo" placeholder="输入仓库名称" value="${githubConfig.repository || ''}">
                </div>
                <div class="form-group">
                    <label for="github-token">访问令牌</label>
                    <input type="password" id="github-token" placeholder="输入GitHub个人访问令牌" value="${githubConfig.token || ''}">
                    <p class="token-note">需要具有repo权限的访问令牌，<a href="https://github.com/settings/tokens" target="_blank">点击创建</a></p>
                </div>
                <div class="form-group">
                    <div class="config-note">
                        <p><strong>使用说明：</strong></p>
                        <ol>
                            <li>创建一个GitHub仓库用于存储书签</li>
                            <li>生成一个具有repo权限的访问令牌</li>
                            <li>填写以上信息并保存</li>
                        </ol>
                        <p>配置完成后，您可以使用"同步到GitHub"和"从GitHub更新"按钮</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn cancel-btn">取消</button>
                <button class="modal-btn submit-btn">保存配置</button>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .token-note {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .token-note a {
            color: #3498DB;
            text-decoration: none;
        }
        
        .token-note a:hover {
            text-decoration: underline;
        }
        
        .config-note {
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 14px;
        }
        
        .config-note p {
            margin: 5px 0;
        }
        
        .config-note ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        
        .config-note li {
            margin-bottom: 5px;
        }
    `;
    document.head.appendChild(style);
    
    // 添加到文档
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // 取消按钮事件
    const cancelBtn = modal.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // 提交按钮事件
    const submitBtn = modal.querySelector('.submit-btn');
    submitBtn.addEventListener('click', () => {
        const username = document.getElementById('github-username').value.trim();
        const repository = document.getElementById('github-repo').value.trim();
        const token = document.getElementById('github-token').value.trim();
        
        // 验证必填字段
        if (!username) {
            alert('请输入GitHub用户名');
            return;
        }
        
        if (!repository) {
            alert('请输入仓库名称');
            return;
        }
        
        if (!token) {
            alert('请输入GitHub访问令牌');
            return;
        }
        
        // 确保bookmarksData已初始化
        if (!bookmarksData) {
            bookmarksData = {
                version: "1.0",
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    lastSynced: null,
                    totalBookmarks: 0,
                    syncStatus: "unsaved"
                },
                favoriteBookmarks: [],
                categories: [],
                customCategories: [],
                settings: {}
            };
        }
        
        // 确保settings已初始化
        if (!bookmarksData.settings) {
            bookmarksData.settings = {};
        }
        
        // 更新配置
        bookmarksData.settings.github = {
            username,
            repository,
            token,
            configured: true
        };
        
        // 保存配置
        saveBookmarksData();
        
        // 关闭弹窗
        modal.remove();
        
        // 显示成功提示
        showToast('GitHub配置已保存');
    });
}

// 更新所有网站图标
function updateAllIcons() {
    // 获取所有网站卡片
    const cards = document.querySelectorAll('.website-card');
    let totalCards = cards.length;
    let updatedCards = 0;
    
    // 如果没有卡片，显示提示
    if (totalCards === 0) {
        showToast('没有网站卡片需要更新');
        return;
    }
    
    // 显示更新进度弹窗
    showUpdateIconsModal(updatedCards, totalCards);
    
    // 逐个更新图标
    cards.forEach((card, index) => {
        // 延迟执行，避免同时发送大量请求
        setTimeout(() => {
            updateCardIcon(card);
            
            // 更新进度
            updatedCards++;
            updateIconsProgress(updatedCards, totalCards);
            
            // 如果全部更新完成，关闭进度弹窗
            if (updatedCards === totalCards) {
                setTimeout(() => {
                    closeUpdateIconsModal();
                    showToast('所有图标更新完成');
                }, 500);
            }
        }, index * 300); // 每300毫秒更新一个图标
    });
}

// 更新单个卡片的图标
function updateCardIcon(card) {
    const url = card.dataset.url;
    const iconElement = card.querySelector('.website-icon');
    
    // 如果没有URL，不进行更新
    if (!url) return;
    
    try {
        // 解析域名
        const domain = new URL(url).hostname;
        
        // 构建favicon URL
        const faviconUrl = `https://${domain}/favicon.ico`;
        
        // 检查是否已有图片元素
        let imgElement = iconElement.querySelector('.favicon-img');
        
        // 如果没有图片元素，创建一个
        if (!imgElement) {
            imgElement = document.createElement('img');
            imgElement.className = 'favicon-img';
            imgElement.alt = card.querySelector('.website-name').textContent.charAt(0);
            iconElement.appendChild(imgElement);
        }
        
        // 清除之前的文本内容
        iconElement.textContent = '';
        iconElement.appendChild(imgElement);
        
        // 设置加载失败的回调
        imgElement.onerror = function() {
            // 如果加载失败，尝试使用Google的favicon服务
            this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            
            // 如果Google的服务也失败，使用文字图标
            this.onerror = function() {
                this.style.display = 'none';
                iconElement.style.background = '#4285F4';
                iconElement.textContent = card.querySelector('.website-name').textContent.charAt(0);
                iconElement.dataset.useDefault = 'true';
                
                // 保存默认图标到缓存
                saveIconToCache(domain, '', 'default');
            };
        };
        
        // 设置加载成功的回调
        imgElement.onload = function() {
            this.style.display = 'block';
            iconElement.style.background = 'white';
            iconElement.dataset.useDefault = 'false';
            
            // 保存图标URL到缓存
            saveIconToCache(domain, this.src, 'url');
        };
        
        // 尝试从缓存加载
        const cachedIcon = getIconFromCache(domain);
        if (cachedIcon) {
            if (cachedIcon.type === 'url') {
                imgElement.src = cachedIcon.data;
            } else {
                // 使用默认文字图标
                imgElement.style.display = 'none';
                iconElement.style.background = '#4285F4';
                iconElement.textContent = card.querySelector('.website-name').textContent.charAt(0);
                iconElement.dataset.useDefault = 'true';
            }
        } else {
            // 如果没有缓存，从网络加载
            imgElement.src = faviconUrl;
        }
    } catch (error) {
        console.error('更新图标失败:', error);
    }
}

// 显示更新图标进度弹窗
function showUpdateIconsModal(current, total) {
    // 检查是否已存在弹窗
    let modal = document.getElementById('updateIconsModal');
    
    if (!modal) {
        // 创建弹窗
        modal = document.createElement('div');
        modal.id = 'updateIconsModal';
        modal.className = 'update-icons-modal';
        
        // 弹窗内容
        modal.innerHTML = `
            <div class="update-icons-content">
                <div class="update-icons-title">正在更新网站图标</div>
                <div class="progress-container">
                    <div class="progress-bar" id="updateIconsProgress"></div>
                </div>
                <div class="update-icons-info" id="updateIconsInfo">更新中: 0/${total}</div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .update-icons-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            }
            
            .update-icons-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
            }
            
            .update-icons-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .progress-container {
                height: 10px;
                background-color: #f0f0f0;
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .progress-bar {
                height: 100%;
                background-color: #E74C3C;
                width: 0%;
                transition: width 0.3s;
            }
            
            .update-icons-info {
                text-align: center;
                font-size: 14px;
                color: #666;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
        document.getElementById('updateIconsInfo').textContent = `更新中: ${current}/${total}`;
    }
}

// 更新图标进度
function updateIconsProgress(current, total) {
    const progressBar = document.getElementById('updateIconsProgress');
    const infoText = document.getElementById('updateIconsInfo');
    
    if (progressBar && infoText) {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        infoText.textContent = `更新中: ${current}/${total}`;
    }
}

// 关闭更新图标进度弹窗
function closeUpdateIconsModal() {
    const modal = document.getElementById('updateIconsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 导入浏览器书签HTML
function importBookmarksFromHTML() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.html, .htm';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 触发文件选择
    fileInput.click();
    
    // 监听文件选择事件
    fileInput.addEventListener('change', async function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            try {
                // 读取文件内容
                const content = await readFileContent(file);
                
                // 解析HTML内容
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                
                // 显示导入进度弹窗
                showImportModal();
                
                // 解析书签
                const bookmarks = parseBookmarks(doc);
                
                // 智能分类书签
                const categorizedBookmarks = categorizeBookmarks(bookmarks);
                
                // 导入书签到系统
                const totalImported = await importCategorizedBookmarks(categorizedBookmarks);
                
                // 关闭导入进度弹窗
                closeImportModal();
                
                // 显示成功提示
                showToast(`成功导入 ${totalImported} 个书签`);
                
                // 重新初始化界面以显示导入的书签
                if (bookmarksData) {
                    // 清空当前界面
                    document.querySelector('.content').innerHTML = '';
                    document.querySelector('.sidebar').innerHTML = '';
                    
                    // 重新初始化侧边栏和内容区域
                    initializeSidebar(bookmarksData.categories);
                    initializeContent(bookmarksData.categories);
                    
                    // 调整侧边栏高度
                    adjustSidebarHeight();
                    
                    // 添加侧边栏滚动监听
                    setupSidebarScroll();
                    
                    // 为所有卡片添加按钮组
                    document.querySelectorAll('.website-card').forEach(card => {
                        createCardButtonGroup(card);
                    });
                    
                    // 如果处于编辑模式，显示按钮组
                    if (document.body.classList.contains('edit-mode')) {
                        document.querySelectorAll('.card-btn-group').forEach(btnGroup => {
                            btnGroup.style.display = 'block';
                        });
                    }
                } else {
                    // 如果没有成功加载数据，刷新页面
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            } catch (error) {
                console.error('导入书签失败:', error);
                closeImportModal();
                showToast('导入书签失败，请检查文件格式');
            }
        }
        
        // 移除文件输入元素
        document.body.removeChild(fileInput);
    });
}

// 读取文件内容
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        reader.onerror = function() {
            reject(new Error('读取文件失败'));
        };
        
        reader.readAsText(file);
    });
}

// 解析书签
function parseBookmarks(doc) {
    const bookmarks = [];
    
    // 查找所有A标签
    const links = doc.querySelectorAll('a');
    
    links.forEach(link => {
        const url = link.href;
        const title = link.textContent.trim();
        
        // 忽略空链接或javascript链接
        if (!url || url.startsWith('javascript:') || url.startsWith('#')) {
            return;
        }
        
        // 提取添加日期（如果有）
        let addDate = null;
        if (link.hasAttribute('add_date')) {
            const timestamp = parseInt(link.getAttribute('add_date'));
            if (!isNaN(timestamp)) {
                addDate = new Date(timestamp * 1000).toISOString();
            }
        }
        
        // 提取文件夹路径
        let folderPath = [];
        let parent = link.parentElement;
        while (parent) {
            if (parent.tagName === 'DL' && parent.previousElementSibling && parent.previousElementSibling.tagName === 'H3') {
                folderPath.unshift(parent.previousElementSibling.textContent.trim());
            }
            parent = parent.parentElement;
        }
        
        // 添加到书签列表
        bookmarks.push({
            title: title,
            url: url,
            addDate: addDate,
            folderPath: folderPath
        });
    });
    
    return bookmarks;
}

// 智能分类书签
function categorizeBookmarks(bookmarks) {
    // 初始化分类
    const categories = {
        '搜索引擎': [],
        '开发工具': [],
        '新闻资讯': [],
        '购物网站': [],
        '社交媒体': [],
        '视频娱乐': [],
        '学习教育': [],
        '游戏': [],
        '其他': []
    };
    
    // 关键词映射
    const keywordMap = {
        '搜索引擎': ['google', 'bing', 'baidu', 'yahoo', 'search', 'duckduckgo', 'sogou', '搜索', '百度', '谷歌', '必应'],
        '开发工具': ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'coding', 'dev', 'developer', 'code', 'npm', 'yarn', 'python', 'java', 'javascript', 'php', 'ruby', 'api', 'docs', 'documentation', 'vscode', 'ide', '编程', '开发'],
        '新闻资讯': ['news', 'blog', 'medium', 'zhihu', 'weibo', 'twitter', 'reddit', '新闻', '资讯', '知乎', '微博', '博客'],
        '购物网站': ['shop', 'mall', 'taobao', 'jd', 'amazon', 'tmall', 'ebay', 'aliexpress', 'walmart', '购物', '淘宝', '京东', '天猫', '亚马逊'],
        '社交媒体': ['facebook', 'instagram', 'twitter', 'linkedin', 'wechat', 'qq', 'whatsapp', 'telegram', 'discord', 'slack', '微信', '社交'],
        '视频娱乐': ['video', 'youtube', 'bilibili', 'netflix', 'hulu', 'disney', 'tiktok', 'douyin', 'movie', 'tv', 'film', 'anime', '视频', '电影', '电视', '动漫', 'b站'],
        '学习教育': ['learn', 'course', 'education', 'study', 'tutorial', 'university', 'college', 'school', 'mooc', 'udemy', 'coursera', 'edx', '学习', '教育', '课程', '大学', '学校'],
        '游戏': ['game', 'steam', 'epic', 'origin', 'uplay', 'playstation', 'xbox', 'nintendo', 'switch', '游戏', '游戏平台']
    };
    
    // 使用原始文件夹结构
    const folderStructure = {};
    
    bookmarks.forEach(bookmark => {
        // 首先尝试使用原始文件夹结构
        if (bookmark.folderPath && bookmark.folderPath.length > 0) {
            const folderName = bookmark.folderPath[bookmark.folderPath.length - 1];
            if (!folderStructure[folderName]) {
                folderStructure[folderName] = [];
            }
            folderStructure[folderName].push(bookmark);
            return;
        }
        
        // 如果没有文件夹结构，尝试通过关键词分类
        const url = bookmark.url.toLowerCase();
        const title = bookmark.title.toLowerCase();
        
        let categorized = false;
        
        for (const [category, keywords] of Object.entries(keywordMap)) {
            for (const keyword of keywords) {
                if (url.includes(keyword) || title.includes(keyword)) {
                    categories[category].push(bookmark);
                    categorized = true;
                    break;
                }
            }
            if (categorized) break;
        }
        
        // 如果无法分类，放入"其他"类别
        if (!categorized) {
            categories['其他'].push(bookmark);
        }
    });
    
    // 合并文件夹结构和关键词分类
    const result = { ...categories };
    
    // 添加原始文件夹作为分类
    for (const [folderName, bookmarkList] of Object.entries(folderStructure)) {
        if (bookmarkList.length >= 3) { // 只有当文件夹中有足够多的书签时才创建新分类
            result[folderName] = bookmarkList;
        } else {
            // 否则将书签添加到"其他"类别
            result['其他'] = [...result['其他'], ...bookmarkList];
        }
    }
    
    // 过滤掉空分类
    const finalResult = {};
    for (const [category, bookmarkList] of Object.entries(result)) {
        if (bookmarkList.length > 0) {
            finalResult[category] = bookmarkList;
        }
    }
    
    return finalResult;
}

// 导入分类后的书签
async function importCategorizedBookmarks(categorizedBookmarks) {
    // 如果没有书签数据，初始化
    if (!bookmarksData) {
        bookmarksData = {
            version: "1.0",
            metadata: {
                lastUpdated: new Date().toISOString(),
                lastSynced: null,
                totalBookmarks: 0,
                syncStatus: "unsaved"
            },
            favoriteBookmarks: [],
            categories: [],
            customCategories: [],
            settings: {
                viewMode: "card"
            }
        };
    }
    
    // 记录导入的书签总数
    let totalImported = 0;
    
    // 处理每个分类
    for (const [categoryName, bookmarks] of Object.entries(categorizedBookmarks)) {
        // 查找现有分类或创建新分类
        let category = bookmarksData.categories.find(c => c.name === categoryName);
        
        if (!category) {
            // 创建新分类
            category = {
                name: categoryName,
                icon: getCategoryIcon(categoryName),
                bookmarks: []
            };
            
            bookmarksData.categories.push(category);
            
            // 添加到自定义分类
            if (!bookmarksData.customCategories) {
                bookmarksData.customCategories = [];
            }
            bookmarksData.customCategories.push({
                name: categoryName,
                icon: getCategoryIcon(categoryName)
            });
        }
        
        // 添加书签到分类
        for (const bookmark of bookmarks) {
            // 检查是否已存在相同URL的书签
            const existingBookmark = category.bookmarks.find(b => b.url === bookmark.url);
            
            if (!existingBookmark) {
                // 创建新书签对象
                const newBookmark = {
                    id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: bookmark.title,
                    url: bookmark.url,
                    icon: "🔗",
                    isFavorite: false
                };
                
                // 添加到分类
                category.bookmarks.push(newBookmark);
                totalImported++;
            }
        }
    }
    
    // 更新元数据
    if (bookmarksData.metadata) {
        bookmarksData.metadata.lastUpdated = new Date().toISOString();
        bookmarksData.metadata.totalBookmarks += totalImported;
        bookmarksData.metadata.syncStatus = "unsaved";
    }
    
    // 保存书签数据
    saveBookmarksData();
    
    return totalImported;
}

// 获取分类图标
function getCategoryIcon(categoryName) {
    const iconMap = {
        '搜索引擎': '🔍',
        '开发工具': '⚙️',
        '新闻资讯': '📰',
        '购物网站': '🛒',
        '社交媒体': '👥',
        '视频娱乐': '🎬',
        '学习教育': '📚',
        '游戏': '🎮',
        '其他': '📁'
    };
    
    return iconMap[categoryName] || '📁';
}

// 显示导入进度弹窗
function showImportModal() {
    // 检查是否已存在弹窗
    let modal = document.getElementById('importModal');
    
    if (!modal) {
        // 创建弹窗
        modal = document.createElement('div');
        modal.id = 'importModal';
        modal.className = 'import-modal';
        
        // 弹窗内容
        modal.innerHTML = `
            <div class="import-content">
                <div class="import-title">正在导入书签</div>
                <div class="import-spinner"></div>
                <div class="import-info">正在解析和分类书签，请稍候...</div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .import-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            }
            
            .import-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
                text-align: center;
            }
            
            .import-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            .import-spinner {
                width: 40px;
                height: 40px;
                margin: 0 auto 20px;
                border: 4px solid #f0f0f0;
                border-top: 4px solid #E74C3C;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .import-info {
                font-size: 14px;
                color: #666;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
}

// 关闭导入进度弹窗
function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 将书签移动到其他分类
function moveBookmarkToCategory(card, targetCategoryName) {
    // 获取当前卡片所在的分类区域
    const currentSection = card.closest('.section');
    const currentCategoryName = currentSection.querySelector('.section-title').textContent;
    
    // 如果目标分类与当前分类相同，不执行操作
    if (currentCategoryName === targetCategoryName) {
        showToast('书签已在该分类中');
        return;
    }
    
    // 获取卡片信息
    const websiteName = card.querySelector('.website-name').textContent;
    const websiteDesc = card.querySelector('.website-desc').textContent;
    const websiteUrl = card.dataset.url;
    const websiteIcon = card.querySelector('.website-icon');
    
    // 获取目标分类区域
    let targetSection = null;
    document.querySelectorAll('.section-title').forEach(title => {
        if (title.textContent === targetCategoryName) {
            targetSection = title.closest('.section');
        }
    });
    
    if (!targetSection) {
        showToast(`找不到分类: ${targetCategoryName}`);
        return;
    }
    
    const targetGrid = targetSection.querySelector('.website-grid');
    
    // 创建新卡片
    const newCard = createWebsiteCard(
        targetGrid,
        websiteName,
        websiteDesc,
        websiteUrl,
        websiteIcon.textContent,
        websiteIcon.style.background
    );
    
    // 添加移动成功的动画效果
    newCard.style.animation = 'highlight-card 1.5s';
    
    // 更新 bookmarksData
    if (bookmarksData) {
        // 查找源分类和目标分类
        const sourceCategoryIndex = bookmarksData.categories.findIndex(cat => cat.name === currentCategoryName);
        const targetCategoryIndex = bookmarksData.categories.findIndex(cat => cat.name === targetCategoryName);
        
        if (sourceCategoryIndex !== -1 && targetCategoryIndex !== -1) {
            // 查找书签索引
            const bookmarkIndex = bookmarksData.categories[sourceCategoryIndex].bookmarks.findIndex(b => b.url === websiteUrl);
            
            if (bookmarkIndex !== -1) {
                // 获取书签对象
                const bookmark = bookmarksData.categories[sourceCategoryIndex].bookmarks[bookmarkIndex];
                
                // 从源分类中删除
                bookmarksData.categories[sourceCategoryIndex].bookmarks.splice(bookmarkIndex, 1);
                
                // 添加到目标分类
                bookmarksData.categories[targetCategoryIndex].bookmarks.push(bookmark);
                
                // 标记为未同步
                if (bookmarksData.metadata) {
                    bookmarksData.metadata.syncStatus = "unsaved";
                }
                
                // 保存书签数据
                saveBookmarksData();
            }
        }
    }
    
    // 从原分类中删除卡片
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    
    // 动画结束后移除元素
    setTimeout(() => {
        card.remove();
        // 调整侧边栏高度
        adjustSidebarHeight();
    }, 300);
    
    // 显示成功提示
    showToast(`已将"${websiteName}"移动到"${targetCategoryName}"`);
    
    // 滚动到目标分类
    targetSection.scrollIntoView({ behavior: 'smooth' });
}

// 显示移动书签弹窗
function showMoveBookmarkModal(card) {
    // 防止重复弹窗
    if (isMoveModalShowing) {
        return;
    }
    
    // 设置弹窗显示状态
    isMoveModalShowing = true;
    
    // 获取当前卡片所在的分类
    const currentSection = card.closest('.section');
    const currentCategoryName = currentSection.querySelector('.section-title').textContent;
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'move-bookmark-modal';
    
    // 获取所有分类
    const categories = [];
    document.querySelectorAll('.section-title').forEach(title => {
        const categoryName = title.textContent;
        if (categoryName !== currentCategoryName && categoryName !== '我的导航') {
            categories.push(categoryName);
        }
    });
    
    // 弹窗内容
    modal.innerHTML = `
        <div class="move-bookmark-content">
            <div class="move-bookmark-header">
                <div class="move-bookmark-title">移动到其他分类</div>
                <button class="close-move-bookmark-modal">&times;</button>
            </div>
            <div class="move-bookmark-body">
                <div class="move-bookmark-info">
                    选择要将 "${card.querySelector('.website-name').textContent}" 移动到的目标分类:
                </div>
                <div class="category-list">
                    ${categories.map(category => `
                        <div class="category-item" data-category="${category}">
                            <div class="category-icon">${getCategoryIcon(category)}</div>
                            <div class="category-name">${category}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="move-bookmark-footer">
                <button class="move-bookmark-btn cancel-btn">取消</button>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .move-bookmark-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        }
        
        .move-bookmark-content {
            background-color: white;
            border-radius: 8px;
            width: 500px;
            max-width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        
        .move-bookmark-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .move-bookmark-title {
            font-size: 18px;
            font-weight: bold;
        }
        
        .close-move-bookmark-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        
        .move-bookmark-body {
            padding: 15px 20px;
            overflow-y: auto;
            flex-grow: 1;
        }
        
        .move-bookmark-info {
            margin-bottom: 15px;
            color: #666;
        }
        
        .category-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .category-item {
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background-color 0.2s;
        }
        
        .category-item:hover {
            background-color: #f5f5f5;
        }
        
        .category-icon {
            margin-right: 10px;
            font-size: 18px;
        }
        
        .category-name {
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .move-bookmark-footer {
            padding: 15px 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
        }
        
        .move-bookmark-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .cancel-btn {
            background-color: #f0f0f0;
            color: #333;
        }
        
        @keyframes highlight-card {
            0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
            50% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
            100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 添加分类项点击事件
    modal.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            const targetCategory = this.dataset.category;
            moveBookmarkToCategory(card, targetCategory);
            modal.remove();
            isMoveModalShowing = false; // 重置状态
        });
    });
    
    // 添加关闭按钮事件
    const closeBtn = modal.querySelector('.close-move-bookmark-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
        isMoveModalShowing = false; // 重置状态
    });
    
    // 添加取消按钮事件
    const cancelBtn = modal.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        modal.remove();
        isMoveModalShowing = false; // 重置状态
    });
}

// 创建卡片按钮组
function createCardButtonGroup(card) {
    // 如果已经有按钮组，则不重复添加
    if (card.querySelector('.card-btn-group')) {
        return;
    }
    
    // 创建按钮组容器
    const btnGroup = document.createElement('div');
    btnGroup.className = 'card-btn-group';
    
    // 添加样式
    btnGroup.style.position = 'absolute';
    btnGroup.style.top = '50%';
    btnGroup.style.left = '50%';
    btnGroup.style.transform = 'translate(-50%, -50%)';
    btnGroup.style.display = 'none'; // 默认隐藏，编辑模式时显示
    btnGroup.style.zIndex = '10';
    btnGroup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // 稍微加深背景色
    btnGroup.style.padding = '10px'; // 减少内边距，让按钮更紧凑
    btnGroup.style.borderRadius = '30px'; // 更圆润的边角
    btnGroup.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)'; // 添加阴影效果
    btnGroup.style.width = '180px'; // 固定宽度，确保有足够空间
    btnGroup.style.height = '60px'; // 固定高度
    btnGroup.style.display = 'none'; // 初始隐藏
    
    // 创建收藏按钮
    const favoriteBtn = document.createElement('div');
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.innerHTML = '★';
    favoriteBtn.title = '收藏到我的导航';
    favoriteBtn.style.position = 'absolute'; // 使用绝对定位
    favoriteBtn.style.left = '20px'; // 左侧位置
    favoriteBtn.style.top = '50%';
    favoriteBtn.style.transform = 'translateY(-50%)';
    favoriteBtn.style.width = '40px'; // 增大按钮尺寸
    favoriteBtn.style.height = '40px';
    favoriteBtn.style.borderRadius = '50%';
    favoriteBtn.style.backgroundColor = '#F39C12';
    favoriteBtn.style.color = 'white';
    favoriteBtn.style.display = 'flex';
    favoriteBtn.style.justifyContent = 'center';
    favoriteBtn.style.alignItems = 'center';
    favoriteBtn.style.cursor = 'pointer';
    favoriteBtn.style.fontSize = '20px'; // 增大图标尺寸
    favoriteBtn.style.transition = 'all 0.2s';
    favoriteBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)'; // 添加按钮阴影
    favoriteBtn.style.zIndex = '11'; // 确保按钮在上层
    
    // 添加悬停效果
    favoriteBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.15)';
        this.style.boxShadow = '0 3px 7px rgba(0, 0, 0, 0.3)';
    });
    
    favoriteBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-50%)';
        this.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    });
    
    // 添加收藏点击事件
    favoriteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        
        // 获取卡片信息
        const websiteName = card.querySelector('.website-name').textContent;
        const websiteDesc = card.querySelector('.website-desc').textContent;
        const websiteUrl = card.dataset.url;
        const websiteIcon = card.querySelector('.website-icon');
        const iconText = websiteIcon.textContent;
        const iconColor = websiteIcon.style.background;
        
        // 添加到我的导航
        addToMyNavigation(websiteName, websiteDesc, websiteUrl, iconText, iconColor);
        
        // 显示成功提示
        showToast(`已将"${websiteName}"添加到我的导航`);
    });
    
    // 创建移动按钮
    const moveBtn = document.createElement('div');
    moveBtn.className = 'move-btn';
    moveBtn.innerHTML = '↗';
    moveBtn.title = '移动到其他分类';
    moveBtn.style.position = 'absolute'; // 使用绝对定位
    moveBtn.style.left = '70px'; // 居中位置
    moveBtn.style.top = '50%';
    moveBtn.style.transform = 'translateY(-50%)';
    moveBtn.style.width = '40px'; // 增大按钮尺寸
    moveBtn.style.height = '40px';
    moveBtn.style.borderRadius = '50%';
    moveBtn.style.backgroundColor = '#3498DB';
    moveBtn.style.color = 'white';
    moveBtn.style.display = 'flex';
    moveBtn.style.justifyContent = 'center';
    moveBtn.style.alignItems = 'center';
    moveBtn.style.cursor = 'pointer';
    moveBtn.style.fontSize = '20px'; // 增大图标尺寸
    moveBtn.style.transition = 'all 0.2s';
    moveBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)'; // 添加按钮阴影
    moveBtn.style.zIndex = '12'; // 确保按钮在上层
    
    // 添加悬停效果
    moveBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.15)';
        this.style.boxShadow = '0 3px 7px rgba(0, 0, 0, 0.3)';
    });
    
    moveBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-50%)';
        this.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    });
    
    // 添加移动点击事件
    moveBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        showMoveBookmarkModal(card);
    });
    
    // 创建删除按钮
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = '删除';
    deleteBtn.style.position = 'absolute'; // 使用绝对定位
    deleteBtn.style.right = '20px'; // 右侧位置
    deleteBtn.style.top = '50%';
    deleteBtn.style.transform = 'translateY(-50%)';
    deleteBtn.style.width = '40px'; // 增大按钮尺寸
    deleteBtn.style.height = '40px';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.backgroundColor = '#E74C3C';
    deleteBtn.style.color = 'white';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '22px'; // 增大图标尺寸
    deleteBtn.style.transition = 'all 0.2s';
    deleteBtn.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)'; // 添加按钮阴影
    deleteBtn.style.zIndex = '13'; // 确保按钮在上层
    
    // 添加悬停效果
    deleteBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.15)';
        this.style.boxShadow = '0 3px 7px rgba(0, 0, 0, 0.3)';
    });
    
    deleteBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-50%)';
        this.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    });
    
    // 添加删除点击事件
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        
        // 防止重复弹窗
        if (isDeleteConfirmShowing) {
            return;
        }
        
        // 设置确认弹窗显示状态
        isDeleteConfirmShowing = true;
        
        // 确认删除
        if (confirm(`确定要删除"${card.querySelector('.website-name').textContent}"吗？`)) {
            // 添加删除动画
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            
            // 获取卡片ID
            const cardId = card.dataset.id;
            
            // 动画结束后移除元素
            setTimeout(() => {
                // 检查是否是我的导航区域的卡片
                const isInMyNavigation = card.closest('#category-我的导航') !== null;
                
                // 如果是我的导航区域，且有卡片ID和bookmarksData，从favoriteBookmarks中删除
                if (isInMyNavigation && cardId && bookmarksData && bookmarksData.favoriteBookmarks) {
                    const index = bookmarksData.favoriteBookmarks.findIndex(bookmark => bookmark.id === cardId);
                    if (index !== -1) {
                        bookmarksData.favoriteBookmarks.splice(index, 1);
                        
                        // 更新同步状态
                        if (bookmarksData.metadata) {
                            bookmarksData.metadata.syncStatus = "unsaved";
                        }
                        
                        // 保存书签数据
                        saveBookmarksData();
                    }
                }
                
                card.remove();
                // 调整侧边栏高度
                adjustSidebarHeight();
            }, 300);
        }
        
        // 重置确认弹窗状态
        setTimeout(() => {
            isDeleteConfirmShowing = false;
        }, 100);
    });
    
    // 将按钮添加到按钮组
    btnGroup.appendChild(favoriteBtn);
    btnGroup.appendChild(moveBtn);
    btnGroup.appendChild(deleteBtn);
    
    // 添加到卡片
    card.appendChild(btnGroup);
}

// 初始化搜索功能
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // 添加搜索按钮点击事件
    searchBtn.addEventListener('click', function() {
        performSearch(searchInput.value);
    });
    
    // 添加输入框回车事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });
    
    // 添加输入框实时搜索事件（可选）
    searchInput.addEventListener('input', function() {
        if (this.value.length > 1) {
            performSearch(this.value);
        } else if (this.value.length === 0) {
            // 如果搜索框被清空，恢复所有内容
            resetSearch();
        }
    });
}

// 执行搜索
function performSearch(query) {
    if (!query || query.trim() === '') {
        resetSearch();
        return;
    }
    
    query = query.toLowerCase().trim();
    
    // 获取所有网站卡片
    const allCards = document.querySelectorAll('.website-card');
    
    // 标记是否有匹配的结果
    let hasResults = false;
    
    // 遍历所有卡片，检查是否匹配搜索词
    allCards.forEach(card => {
        if (card.classList.contains('add-website-card')) {
            // 跳过"添加网站"卡片
            card.style.display = 'none';
            return;
        }
        
        // 获取卡片内容
        const name = card.querySelector('.website-name').textContent.toLowerCase();
        const desc = card.querySelector('.website-desc').textContent.toLowerCase();
        const url = card.dataset.url ? card.dataset.url.toLowerCase() : '';
        
        // 检查是否匹配搜索词
        const isMatch = name.includes(query) || 
                        desc.includes(query) || 
                        url.includes(query);
        
        // 显示或隐藏卡片
        if (isMatch) {
            card.style.display = 'flex';
            card.style.animation = 'highlight-card 1s';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 获取所有分类区域
    const allSections = document.querySelectorAll('.section');
    
    // 处理每个分类区域
    allSections.forEach(section => {
        // 获取该分类下的所有可见卡片（不包括"添加网站"卡片）
        const visibleCards = section.querySelectorAll('.website-card:not(.add-website-card)[style*="display: flex"]');
        
        // 如果该分类下没有匹配的卡片，隐藏整个分类
        if (visibleCards.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            
            // 显示"添加网站"卡片
            const addCard = section.querySelector('.add-website-card');
            if (addCard) {
                addCard.style.display = 'flex';
            }
        }
    });
    
    // 显示搜索结果提示
    if (!hasResults) {
        showToast(`未找到与"${query}"相关的书签`);
    } else {
        // 移除之前的搜索提示（如果有）
        const existingNotice = document.querySelector('.search-notice');
        if (existingNotice) {
            existingNotice.remove();
        }
        
        // 添加搜索提示
        const searchNotice = document.createElement('div');
        searchNotice.className = 'search-notice';
        searchNotice.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 10px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 15px;">
                <span style="margin-right: 10px;">🔍 搜索"${query}"的结果</span>
                <button id="reset-search" style="padding: 5px 10px; border: none; border-radius: 4px; background-color: #e0e0e0; cursor: pointer;">清除</button>
            </div>
        `;
        
        // 插入到第一个可见的分类区域之前
        const firstVisibleSection = document.querySelector('.section[style*="display: block"]');
        if (firstVisibleSection) {
            firstVisibleSection.parentNode.insertBefore(searchNotice, firstVisibleSection);
            
            // 添加清除按钮点击事件
            document.getElementById('reset-search').addEventListener('click', resetSearch);
        }
    }
}

// 重置搜索，恢复所有内容
function resetSearch() {
    // 恢复所有卡片显示
    document.querySelectorAll('.website-card').forEach(card => {
        card.style.display = 'flex';
        card.style.animation = 'none';
    });
    
    // 恢复所有分类区域显示
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'block';
    });
    
    // 清空搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 移除搜索提示
    const searchNotice = document.querySelector('.search-notice');
    if (searchNotice) {
        searchNotice.remove();
    }
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 清理过期的图标缓存
        cleanupIconCache();
        
        // 加载书签数据
        const data = await loadBookmarks();
        
        if (data) {
            // 初始化侧边栏
            initializeSidebar(data.categories);
            
            // 初始化内容区域
            initializeContent(data.categories);
            
            // 设置侧边栏滚动效果
            setupSidebarScroll();
            
            // 调整侧边栏高度
            adjustSidebarHeight();
            
            // 设置添加网站模态框
            setupAddWebsiteModal();
            
            // 初始化搜索功能
            initializeSearch();
            
            // 注意：添加分类按钮的事件已在前面代码中设置（第296行左右），这里不再重复添加
            
            // GitHub配置按钮
            document.getElementById('github-config-btn').addEventListener('click', showGitHubConfigModal);
            
            // 设置导入书签按钮点击事件
            document.querySelector('.header-btn:nth-child(4)').addEventListener('click', importBookmarksFromHTML);
            
            // 设置检测失效链接按钮点击事件
            document.querySelector('.header-btn:nth-child(5)').addEventListener('click', checkDeadLinks);
            
            // 设置更新图标按钮点击事件
            document.querySelector('.header-btn:nth-child(6)').addEventListener('click', updateAllIcons);
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('加载数据失败，请刷新页面重试');
    }
});

// 图标缓存相关函数
// 从缓存中获取图标
function getIconFromCache(domain) {
    try {
        // 获取缓存数据
        const iconCache = JSON.parse(localStorage.getItem('iconCache') || '{}');
        
        // 检查是否有该域名的缓存
        if (iconCache[domain] && iconCache[domain].expires > Date.now()) {
            return iconCache[domain];
        }
        
        return null;
    } catch (error) {
        console.error('获取图标缓存失败:', error);
        return null;
    }
}

// 将图标保存到缓存
function saveIconToCache(domain, iconData, type = 'url') {
    try {
        // 获取现有缓存
        const iconCache = JSON.parse(localStorage.getItem('iconCache') || '{}');
        
        // 添加或更新缓存
        iconCache[domain] = {
            data: iconData,
            type: type, // 'url' 或 'default'
            expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30天过期
        };
        
        // 保存缓存
        localStorage.setItem('iconCache', JSON.stringify(iconCache));
        
        return true;
    } catch (error) {
        console.error('保存图标缓存失败:', error);
        return false;
    }
}

// 清除过期的图标缓存
function cleanupIconCache() {
    try {
        const iconCache = JSON.parse(localStorage.getItem('iconCache') || '{}');
        const now = Date.now();
        let changed = false;
        
        // 检查每个缓存项
        Object.keys(iconCache).forEach(domain => {
            if (iconCache[domain].expires < now) {
                delete iconCache[domain];
                changed = true;
            }
        });
        
        // 如果有变化，保存更新后的缓存
        if (changed) {
            localStorage.setItem('iconCache', JSON.stringify(iconCache));
        }
    } catch (error) {
        console.error('清理图标缓存失败:', error);
    }
}