// Function to fetch and load profanity list
async function loadProfanityList() {
	const response = await fetch(chrome.runtime.getURL('profanityList.json'));
	const data = await response.json();
	return data.profanities;
}

const replacementWord = "<span class='cuss'>cuss</span>";

// function replaceProfanity(text, profanityList) {
//   const escapedProfanityList = profanityList.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
//   const regex = new RegExp(`\\b(${escapedProfanityList.join('|')})\\b`, 'giu');
//   return text.replace(regex, replacementWord);
// }

function replaceProfanity(text, profanityList) {
	let modifiedText = text;
	for (const profanity of profanityList) {
		const regex = new RegExp(`\\b${profanity}\\b`, 'gi');
		modifiedText = modifiedText.replace(regex, replacementWord);
	}
	return modifiedText;
}

function walk(node, profanityList) {
	if (node.nodeType === 3) { // Text node
		const replacedText = replaceProfanity(node.nodeValue, profanityList);
		if (replacedText !== node.nodeValue) {
			const newNode = document.createElement('span');
			newNode.innerHTML = replacedText;
			node.parentNode.replaceChild(newNode, node);
		}
	} else if (node.nodeType === 1 && node.nodeName.toLowerCase() !== 'script' && node.nodeName.toLowerCase() !== 'style') {
		node.childNodes.forEach(child => walk(child, profanityList));
	}
}

function observeDOMChanges(profanityList) {
	const observer = new MutationObserver(mutations => {
		for (let mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach(node => {
					walk(node, profanityList);
				});
			}

			if (mutation.type === "subtree") {
				walk(mutation.target, profanityList);
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

// Load the profanity list and replace text
loadProfanityList().then(profanityList => {
	walk(document.body, profanityList);
	observeDOMChanges(profanityList); // Start observing DOM changes
});

