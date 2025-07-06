/**
 * DOMHelper - Narzędzia do manipulacji DOM
 * Funkcje pomocnicze do tworzenia i manipulacji elementów DOM
 */

class DOMHelper {
    static createElement(tag, className, textContent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent !== undefined) element.textContent = textContent;
        return element;
    }

    static createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    static clearContainer(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    static addClickAnimation(button) {
        button.classList.remove('click-animation', 'change-animation');
        button.classList.add('click-animation');
        
        setTimeout(() => {
            button.classList.remove('click-animation');
        }, 200);
    }

    static addChangeAnimation(button) {
        button.classList.add('change-animation');
        
        setTimeout(() => {
            button.classList.remove('change-animation');
        }, 600);
    }

    static highlightWordInSentence(sentenceElement, word) {
        const text = sentenceElement.textContent;
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        const highlightedText = text.replace(regex, '<mark>$1</mark>');
        sentenceElement.innerHTML = highlightedText;
    }
}

// 🎯 EXPORT - udostępniamy klasę
export default DOMHelper;