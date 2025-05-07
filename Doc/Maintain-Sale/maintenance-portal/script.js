document.addEventListener('DOMContentLoaded', () => {
    const treeContainer = document.querySelector('.tree-container');
    const moduleContent = document.getElementById('moduleContent');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');

    // Theme handling
    const toggleTheme = () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'moon' : 'sun'}"></i>`;
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
    themeToggle.addEventListener('click', toggleTheme);

    // Create tree item element
    const createTreeItem = (item) => {
        const div = document.createElement('div');
        div.className = 'tree-item';
        
        const header = document.createElement('div');
        header.className = 'item-header';
        
        const icon = document.createElement('i');
        icon.className = `fas ${item.children ? 'fa-chevron-right' : item.icon}`;
        
        const span = document.createElement('span');
        span.textContent = item.name;
        
        header.appendChild(icon);
        header.appendChild(span);
        div.appendChild(header);

        if (item.children) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children';
            item.children.forEach(child => {
                childrenContainer.appendChild(createTreeItem(child));
            });
            div.appendChild(childrenContainer);

            header.addEventListener('click', () => {
                div.classList.toggle('expanded');
            });
        } else {
            header.addEventListener('click', () => {
                showModuleDetails(item);
                // Highlight selected item
                document.querySelectorAll('.item-header').forEach(h => h.classList.remove('selected'));
                header.classList.add('selected');
            });
        }

        return div;
    };

    // Show module details
    const showModuleDetails = (item) => {
        const content = `
            <h2>${item.name}</h2>
            <p class="path"><i class="fas fa-folder"></i> ${item.path}</p>
            <div class="description">
                <h3>Description</h3>
                <p>${item.description}</p>
            </div>
            <div class="maintenance">
                <h3>Maintenance Guidelines</h3>
                <pre>${item.maintainInfo}</pre>
            </div>
        `;
        
        moduleContent.innerHTML = content;
        
        // Add animation
        moduleContent.style.opacity = '0';
        setTimeout(() => {
            moduleContent.style.opacity = '1';
        }, 50);
    };

    // Search functionality
    const searchTree = (query) => {
        const searchRecursive = (items, results = []) => {
            items.forEach(item => {
                if (item.name.toLowerCase().includes(query.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(query.toLowerCase()))) {
                    results.push(item);
                }
                if (item.children) {
                    searchRecursive(item.children, results);
                }
            });
            return results;
        };

        const results = searchRecursive([systemData]);
        
        // Clear and rebuild tree with search results
        treeContainer.innerHTML = '';
        if (query.trim() === '') {
            // Show full tree if search is empty
            treeContainer.appendChild(createTreeItem(systemData));
        } else {
            // Show only matching items
            results.forEach(item => {
                treeContainer.appendChild(createTreeItem({
                    name: item.name,
                    icon: item.icon,
                    path: item.path,
                    description: item.description,
                    maintainInfo: item.maintainInfo
                }));
            });
        }
    };

    // Initialize tree
    treeContainer.appendChild(createTreeItem(systemData));

    // Search input handler
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTree(e.target.value);
        }, 300);
    });

    // Handle quick links
    document.querySelectorAll('.quick-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = e.target.getAttribute('data-module');
            const findModule = (items) => {
                for (const item of items) {
                    if (item.name.toLowerCase() === module) {
                        return item;
                    }
                    if (item.children) {
                        const found = findModule(item.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const moduleItem = findModule([systemData]);
            if (moduleItem) {
                showModuleDetails(moduleItem);
            }
        });
    });

    // Mobile sidebar toggle
    const toggleSidebar = () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    };

    // Add mobile menu button if needed
    if (window.innerWidth <= 768) {
        const menuButton = document.createElement('button');
        menuButton.className = 'mobile-menu';
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        document.querySelector('.header-content').prepend(menuButton);
        menuButton.addEventListener('click', toggleSidebar);
    }
});