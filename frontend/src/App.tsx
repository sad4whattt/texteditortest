import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [content, setContent] = useState('Welcome, Jenni.ai team! Highlight this text to experience the "Paraphrasing" feature! ');
  const [selectedText, setSelectedText] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, show: false });
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const selected = selection.toString();
      setSelectedText(selected);

      if (selected.trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setButtonPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 40,
          show: true
        });
      } else {
        setButtonPosition({ x: 0, y: 0, show: false });
      }
    } else {
      setButtonPosition({ x: 0, y: 0, show: false });
      setSelectedText('');
    }
  };

  const handleParaphrase = async () => {
    if (!selectedText.trim()) {
      alert('Please select some text to paraphrase.');
      return;
    }

    setIsParaphrasing(true);
    setButtonPosition({ x: 0, y: 0, show: false });

    try {
      // Use the deployed Render.com backend URL instead of localhost
      const response = await fetch('https://texteditortest.onrender.com/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to paraphrase');
      }

      const data = await response.json();
      const paraphrased = data.paraphrased;

      // Replace the selected text using DOM manipulation to preserve cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(paraphrased));
        selection.removeAllRanges();
        
        // Update the content state
        if (editorRef.current) {
          setContent(editorRef.current.textContent || '');
        }
      }
      setSelectedText('');
    } catch (error) {
      console.error('Error paraphrasing text:', error);
      alert('Failed to paraphrase text. Please try again.');
    } finally {
      setIsParaphrasing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Text Editor</h1>
      </header>
      
      <main className="editor-container">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          className="text-editor"
          style={{ whiteSpace: 'pre-wrap', minHeight: '200px', border: '1px solid #ccc', padding: '10px', outline: 'none' }}
          suppressContentEditableWarning={true}
        >
          {content}
        </div>
        
        {buttonPosition.show && (
          <button 
            onClick={handleParaphrase}
            disabled={isParaphrasing}
            className="floating-paraphrase-btn"
            style={{
              position: 'fixed',
              left: `${buttonPosition.x - 75}px`,
              top: `${buttonPosition.y}px`,
              zIndex: 1000
            }}
          >
            {isParaphrasing ? 'Paraphrasing...' : 'Paraphrase'}
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
