require.config({
    paths: {
        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs'
    }
});

let editors = {};
let tabCount = 0;
let activeTabId = null;
let socket;

// Main application logic that depends on Monaco Editor
require(['vs/editor/editor.main'], function () {
    const tabBar = document.getElementById('tab-bar');
    const addTabBtn = document.getElementById('add-tab-btn');
    const tabContentContainer = document.getElementById('tab-content-container');
    const themeSelect = document.getElementById('theme-select');

    // Initialize Socket.IO here, now that 'io' is guaranteed to be available
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to Flask backend');
    });

    socket.on('code_output', (data) => {
        const outputElement = document.getElementById(data.tab_id).querySelector('.output-container');
        const editor = editors[data.tab_id];

        if (outputElement) {
            outputElement.textContent = data.output;
            if (data.error) {
                outputElement.classList.add('error');
            } else {
                outputElement.classList.remove('error');
            }
        }

        // Clear previous decorations
        if (editor && editor.currentDecorations) {
            editor.currentDecorations = editor.deltaDecorations(editor.currentDecorations, []);
        }

        // Apply new error decorations if available
        if (data.error && editor) {
            const line = data.error.line || 1; // Default to line 1 if not provided
            const column = data.error.column || 1; // Default to column 1 if not provided

            editor.currentDecorations = editor.deltaDecorations(
                [],
                [
                    {
                        range: new monaco.Range(line, column, line, editor.getModel().getLineMaxColumn(line)),
                        options: {
                            is  : true,
                            className: 'myErrorLine',
                            hoverMessage: { value: data.error.message }
                        }
                    },
                    {
                        range: new monaco.Range(line, column, line, column + 1),
                        options: {
                            className: 'myErrorInline',
                            hoverMessage: { value: data.error.message }
                        }
                    }
                ]
            );
        }
    });

    // Define custom themes for Monaco Editor
    monaco.editor.defineTheme('monokai', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'f92672' },
            { token: 'string', foreground: 'e6db74' },
            { token: 'number', foreground: 'ae81ff' },
            { token: 'comment', foreground: '75715e' },
            { token: 'variable', foreground: 'f8f8f2' },
            { token: 'function', foreground: 'a6e22e' },
            { token: 'type', foreground: '66d9ef' }
        ],
        colors: {
            'editor.foreground': '#F8F8F2',
            'editor.background': '#272822',
            'editorCursor.foreground': '#F8F8F0',
            'editor.lineHighlightBackground': '#3E3D32',
            'editor.selectionBackground': '#49483E',
            'editor.inactiveSelectionBackground': '#49483E',
            'editor.selectionHighlightBackground': '#49483E',
            'editor.wordHighlightBackground': '#49483E',
            'editor.wordHighlightStrongBackground': '#49483E',
            'editorLineNumber.foreground': '#75715E',
            'editorIndentGuide.background': '#3B3A32',
            'editorWhitespace.foreground': '#3B3A32',
            'editorSuggestWidget.background': '#272822',
            'editorSuggestWidget.border': '#49483E',
            'editorSuggestWidget.foreground': '#F8F8F2',
            'editorSuggestWidget.highlightForeground': '#A6E22E',
            'editorSuggestWidget.selectedBackground': '#49483E',
            'editorHoverWidget.background': '#272822',
            'editorHoverWidget.border': '#49483E',
            'editorGutter.background': '#272822'
        }
    });

    monaco.editor.defineTheme('dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'comment', foreground: '6272a4' },
            { token: 'variable', foreground: 'f8f8f2' },
            { token: 'function', foreground: '50fa7b' },
            { token: 'type', foreground: '8be9fd' }
        ],
        colors: {
            'editor.foreground': '#F8F8F2',
            'editor.background': '#282a36',
            'editorCursor.foreground': '#F8F8F0',
            'editor.lineHighlightBackground': '#44475a',
            'editor.selectionBackground': '#44475a',
            'editor.inactiveSelectionBackground': '#44475a',
            'editor.selectionHighlightBackground': '#44475a',
            'editor.wordHighlightBackground': '#44475a',
            'editor.wordHighlightStrongBackground': '#44475a',
            'editorLineNumber.foreground': '#6272a4',
            'editorIndentGuide.background': '#44475a',
            'editorWhitespace.foreground': '#44475a',
            'editorSuggestWidget.background': '#282a36',
            'editorSuggestWidget.border': '#44475a',
            'editorSuggestWidget.foreground': '#F8F8F2',
            'editorSuggestWidget.highlightForeground': '#50fa7b',
            'editorSuggestWidget.selectedBackground': '#44475a',
            'editorHoverWidget.background': '#282a36',
            'editorHoverWidget.border': '#44475a',
            'editorGutter.background': '#282a36'
        }
    });

    monaco.editor.defineTheme('dark-git', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '569cd6' },
            { token: 'string', foreground: 'ce9178' },
            { token: 'number', foreground: 'b5cea8' },
            { token: 'comment', foreground: '6a9955' },
            { token: 'variable', foreground: '9cdcfe' },
            { token: 'function', foreground: 'dcdcaa' },
            { token: 'type', foreground: '4ec9b0' }
        ],
        colors: {
            'editor.foreground': '#D4D4D4',
            'editor.background': '#1E1E1E',
            'editorCursor.foreground': '#AEAFAD',
            'editor.lineHighlightBackground': '#252526',
            'editor.selectionBackground': '#ADD6FF26',
            'editor.inactiveSelectionBackground': '#3A3D41',
            'editor.selectionHighlightBackground': '#ADD6FF26',
            'editor.wordHighlightBackground': '#575757B8',
            'editor.wordHighlightStrongBackground': '#004972',
            'editorLineNumber.foreground': '#858585',
            'editorIndentGuide.background': '#404040',
            'editorWhitespace.foreground': '#3B3A32',
            'editorSuggestWidget.background': '#252526',
            'editorSuggestWidget.border': '#454545',
            'editorSuggestWidget.foreground': '#D4D4D4',
            'editorSuggestWidget.highlightForeground': '#569CD6',
            'editorSuggestWidget.selectedBackground': '#0A649A',
            'editorHoverWidget.background': '#252526',
            'editorHoverWidget.border': '#454545',
            'editorGutter.background': '#1E1E1E'
        }
    });

    function createTab() {
        tabCount++;
        const tabId = `tab-${tabCount}`;

        // Create tab button
        const tabButton = document.createElement('div');
        tabButton.classList.add('tab');
        tabButton.id = `btn-${tabId}`;
        
        const tabName = document.createElement('span');
        tabName.textContent = `Untitled-${tabCount}.js`;
        tabName.addEventListener('click', () => activateTab(tabId));
        
        const closeBtn = document.createElement('button');
        closeBtn.classList.add('close-tab-btn');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent activateTab from firing
            closeTab(tabId);
        });
        
        tabButton.appendChild(tabName);
        tabButton.appendChild(closeBtn);
        tabBar.appendChild(tabButton);

        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.id = tabId;
        tabContentContainer.appendChild(tabContent);

        // Main container for editor and output
        const codeArea = document.createElement('div');
        codeArea.classList.add('code-area');
        tabContent.appendChild(codeArea);

        // Editor Panel
        const editorPanel = document.createElement('div');
        editorPanel.classList.add('panel');
        codeArea.appendChild(editorPanel);

        const editorHeader = document.createElement('div');
        editorHeader.classList.add('panel-header');
        editorHeader.innerHTML = `<i class="fas fa-code"></i><span>Editor de JavaScript</span>`;
        editorPanel.appendChild(editorHeader);

        const editorContainer = document.createElement('div');
        editorContainer.classList.add('editor-container');
        editorPanel.appendChild(editorContainer);

        // Resizer
        const resizer = document.createElement('div');
        resizer.classList.add('resizer');
        codeArea.appendChild(resizer);

        // Result Panel
        const resultPanel = document.createElement('div');
        resultPanel.classList.add('panel');
        codeArea.appendChild(resultPanel);

        const resultHeader = document.createElement('div');
        resultHeader.classList.add('panel-header');
        resultHeader.innerHTML = `<i class="fas fa-terminal"></i><span>Resultado</span>`;
        resultPanel.appendChild(resultHeader);

        const outputContainer = document.createElement('div');
        outputContainer.classList.add('output-container');
        resultPanel.appendChild(outputContainer);


        // Initialize Monaco Editor
        const editor = monaco.editor.create(editorContainer, {
            value: '', // Set initial value to empty string
            language: 'javascript',
            theme: themeSelect.value // Set initial theme
        });

        editors[tabId] = editor;

        // Store current decorations for this editor
        editors[tabId].currentDecorations = [];

        // Live execution on content change
        let debounceTimer;
        editor.onDidChangeModelContent(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                socket.emit('code_change', { code: editor.getValue(), tab_id: tabId });
            }, 300); // 300ms debounce
        });

        // Resizing logic
        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        function handleMouseMove(e) {
            if (!isResizing) return;
            const containerWidth = codeArea.offsetWidth;
            const newEditorWidth = e.clientX - codeArea.getBoundingClientRect().left;
            
            // Set constraints for resizing
            const minWidth = 100; // Minimum width for panels in pixels
            const resizerWidth = resizer.offsetWidth;

            if (newEditorWidth > minWidth && containerWidth - newEditorWidth - resizerWidth > minWidth) {
                editorPanel.style.flexBasis = `${newEditorWidth}px`;
                resultPanel.style.flexBasis = `${containerWidth - newEditorWidth - resizerWidth}px`;
                editor.layout(); // Important to relayout Monaco editor after resize
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        activateTab(tabId);
    }

    function closeTab(tabId) {
        const tabButton = document.getElementById(`btn-${tabId}`);
        const tabContent = document.getElementById(tabId);

        // Remove tab and its content
        tabButton.remove();
        tabContent.remove();

        // Clean up editor instance
        editors[tabId].dispose();
        delete editors[tabId];

        // If the closed tab was active, activate another tab
        if (activeTabId === tabId) {
            const remainingTabs = document.querySelectorAll('.tab');
            if (remainingTabs.length > 0) {
                // Activate the last tab in the list
                const lastTabId = remainingTabs[remainingTabs.length - 1].id.replace('btn-', '');
                activateTab(lastTabId);
            } else {
                activeTabId = null;
                // Optional: create a new tab if all are closed
                createTab();
            }
        }
    }

    function activateTab(tabId) {
        // Deactivate current active tab
        if (activeTabId) {
            document.getElementById(activeTabId).classList.remove('active');
            document.getElementById(`btn-${activeTabId}`).classList.remove('active');
            // Clear decorations from previously active editor
            editors[activeTabId].currentDecorations = editors[activeTabId].deltaDecorations(editors[activeTabId].currentDecorations, []);
        }

        // Activate new tab
        document.getElementById(tabId).classList.add('active');
        document.getElementById(`btn-${tabId}`).classList.add('active');
        activeTabId = tabId;

        // Ensure editor is resized correctly when tab becomes active
        editors[tabId].layout();

        // Emit code on tab activation to get fresh output
        socket.emit('code_change', { code: editors[tabId].getValue(), tab_id: tabId });
    }

    // Theme switching logic
    function applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        // Apply theme to all existing editors
        Object.values(editors).forEach(editor => {
            monaco.editor.setTheme(theme);
        });
    }

    themeSelect.addEventListener('change', (event) => {
        applyTheme(event.target.value);
    });

    // Apply initial theme on load
    applyTheme(themeSelect.value);

    addTabBtn.addEventListener('click', createTab);

    // Create initial tab on load
    createTab();
});