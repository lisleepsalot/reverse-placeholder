// contentScript.js

// Utility: process elements sequentially with a delay
function processElementsSequentially(elements, callback, interval = 5) {
  let index = 0;
  function next() {
    if (index < elements.length) {
      callback(elements[index], index);
      index++;
      setTimeout(next, interval);
    }
  }
  next();
}

// Fetch and log all linked CSS from the page.
function fetchAndLogCSS() {
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach(link => {
    console.log("CSS file:", link.href);
  });
}

// Immediately call fetchAndLogCSS on load
fetchAndLogCSS();

// Replace visible text nodes with the same number of characters from alt text, repeating as needed.
function replaceVisibleText() {
  const altText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus scelerisque, ex sagittis pulvinar suscipit, lacus mauris mollis felis, et feugiat sapien lorem vel nisi. Nulla facilisi. Nam egestas eros non felis pretium aliquam. Sed rutrum lectus ante, nec consectetur lectus mattis eu. Morbi bibendum nisi id nisi ultricies, ut ullamcorper tellus consectetur. In dolor diam, auctor nec imperdiet sed, tempus sit amet ex. Vestibulum malesuada suscipit volutpat. Vivamus non iaculis sem.

Fusce porttitor vestibulum dolor sit amet ultrices. Curabitur euismod facilisis ipsum, eu accumsan tortor dignissim eu. Sed sit amet ante libero. Nunc ut magna ex. Phasellus convallis risus eu erat cursus, at pellentesque leo aliquet. Mauris pellentesque arcu sit amet felis feugiat pellentesque. Mauris ac lobortis lacus. Morbi porta interdum dolor sit amet feugiat. Suspendisse gravida ac nunc id pulvinar. Pellentesque ornare fringilla fringilla.

Quisque dictum sapien nec purus elementum mattis. Aliquam vehicula vulputate lectus, vel interdum odio rutrum non. Ut elementum ante id placerat tincidunt. Sed auctor odio sit amet lacus tincidunt, at commodo urna consectetur. Cras a tortor at turpis maximus facilisis a et diam. Aenean facilisis leo nunc, tempor maximus dui ornare ut. Fusce vitae orci nunc. Curabitur sit amet nisl quis sapien malesuada interdum. Quisque fringilla lacus leo, varius sollicitudin purus fringilla a. Morbi sapien lectus, auctor ut orci quis, imperdiet suscipit enim. Aenean feugiat mattis pharetra. Nullam bibendum diam aliquam, congue odio vitae, bibendum purus. Praesent ex metus, efficitur lacinia auctor vitae, hendrerit eget arcu.`;

  function processNode(node) {
    if (node.closest && node.closest('#style-remover-controls')) return;
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      const len = node.textContent.length;
      const repeatedAlt = altText.repeat(Math.ceil(len / altText.length));
      node.textContent = repeatedAlt.slice(0, len);
    }
    if (node.nodeType === Node.ELEMENT_NODE && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
      node.childNodes.forEach(child => processNode(child));
    }
  }

  processNode(document.body);
}

// Split removeTextStyle into two parts
function removeInlineStyles() {
  const textSelectors = [
    'div', 'p', 'span',
    'h1','h2','h3','h4','h5','h6',
    'a', 'li', 'blockquote', 'label'
  ];
  const elements = Array.from(document.querySelectorAll(textSelectors.join(',')))
                        .filter(el => !el.closest('#style-remover-controls'));
  processElementsSequentially(elements, el => el.removeAttribute('style'));
}

function removeClassAttributes() {
  const textSelectors = [
    'div', 'p', 'span',
    'h1','h2','h3','h4','h5','h6',
    'a', 'li', 'blockquote', 'label'
  ];
  const elements = Array.from(document.querySelectorAll(textSelectors.join(',')))
                        .filter(el => !el.closest('#style-remover-controls'));
  processElementsSequentially(elements, el => el.removeAttribute('class'));
}

/**
 * Replaces all <img> src/srcset and any CSS background-images
 * with a placeholder image from placehold.co, matching the element's dimensions.
 */
function replaceImagesWithPlaceholder() {
  // 1. Replace all <img> elements
  document.querySelectorAll('img').forEach(img => {
    if (img.closest('#style-remover-controls')) return;
    const width = img.naturalWidth || img.width || 150;
    const height = img.naturalHeight || img.height || 150;
    const placeholderUrl = `https://placehold.co/${width}x${height}`;
    img.src = placeholderUrl;
    img.srcset = '';
  });

  // 2. Replace any CSS background-image on all elements
  document.querySelectorAll('*').forEach(el => {
    if (el.closest('#style-remover-controls')) return;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.backgroundImage && style.backgroundImage !== 'none') {
      const width = Math.round(rect.width) || 150;
      const height = Math.round(rect.height) || 150;
      const placeholderUrl = `https://placehold.co/${width}x${height}`;
      el.style.backgroundImage = `url("${placeholderUrl}")`;
    }
  });
}

/**
 * Replaces all <video> tags (and their <source> children)
 * with a placeholder video URL (and poster image).
 * Uses the dimensions of each video element for the poster.
 */
function replaceVideosWithPlaceholder() {
  const defaultVideoSrc = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

  document.querySelectorAll('video').forEach(video => {
    if (video.closest('#style-remover-controls')) return;

    const rect = video.getBoundingClientRect();
    const width = Math.round(rect.width) || 640;
    const height = Math.round(rect.height) || 360;
    const posterPlaceholder = `https://placehold.co/${width}x${height}?text=Video`;

    // Swap poster
    video.poster = posterPlaceholder;

    // Replace <video> src
    if (video.src) {
      video.src = defaultVideoSrc;
    }

    // Replace each <source> child
    video.querySelectorAll('source').forEach(srcEl => {
      srcEl.src = defaultVideoSrc;
    });

    video.load();
  });
}

/**
 * Resets all <div> elements to display:block,
 * stripping out flex/grid and related layout styles.
 */
function normalizeDivsToBlock() {
  const propsToRemove = [
    'display',
    'flex',
    'flex-direction',
    'flex-wrap',
    'justify-content',
    'align-items',
    'grid-template',
    'grid-template-columns',
    'grid-template-rows',
    'grid-auto-flow',
    'grid-auto-columns',
    'grid-auto-rows'
  ];

  const divs = Array.from(document.querySelectorAll('div'));
  processElementsSequentially(divs, div => {
    propsToRemove.forEach(prop => div.style.removeProperty(prop));
    div.style.setProperty('display', 'block', 'important');
  });
}


// Create the button container
const controlPanel = document.createElement('div');
controlPanel.style.position = 'fixed';
controlPanel.style.top = '20px';
controlPanel.style.right = '20px';
controlPanel.style.left = 'auto';
controlPanel.style.zIndex = '9999';
controlPanel.style.backgroundColor = 'white';
controlPanel.style.border = '1px solid black';
controlPanel.style.padding = '10px';
controlPanel.style.borderRadius = '5px';
controlPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
controlPanel.style.maxWidth = '150px';
controlPanel.style.fontFamily = 'Times New Roman, serif';
controlPanel.style.fontSize = '1rem';

// Create the "Run All" button
const runAllBtn = document.createElement('button');
runAllBtn.textContent = 'Run All';
runAllBtn.style.marginBottom = '5px';
runAllBtn.onclick = () => {
  removeInlineStyles();
  setTimeout(() => removeClassAttributes(), 1000);
  setTimeout(() => replaceVisibleText(), 2000);
  setTimeout(() => replaceImagesWithPlaceholder(), 3000);
  setTimeout(() => replaceVideosWithPlaceholder(), 4000);
};

// Insert the cover image above the control panel buttons
const coverImg = document.createElement('img');
coverImg.src = chrome.runtime.getURL('cover.jpg');
coverImg.alt = 'Cover';
coverImg.style.width = '100%';
coverImg.style.display = 'block';
coverImg.style.marginBottom = '10px';
controlPanel.appendChild(coverImg);

controlPanel.appendChild(runAllBtn);
controlPanel.appendChild(document.createElement('br'));

// Create the "Remove Inline Styles" button
const removeInlineBtn = document.createElement('button');
removeInlineBtn.textContent = 'Remove Inline Styles';
removeInlineBtn.style.marginBottom = '5px';
removeInlineBtn.onclick = () => {
  removeInlineStyles();
};

// Create the "Remove Classes" button
const removeClassBtn = document.createElement('button');
removeClassBtn.textContent = 'Remove Classes';
removeClassBtn.style.marginBottom = '5px';
removeClassBtn.onclick = () => {
  removeClassAttributes();
};

// Create the "Replace Visible Text" button
const replaceTextBtn = document.createElement('button');
replaceTextBtn.textContent = 'Replace Visible Text';
replaceTextBtn.style.marginBottom = '5px';
replaceTextBtn.onclick = () => {
  replaceVisibleText();
};

// Create the "Replace Images" button
const replaceImagesBtn = document.createElement('button');
replaceImagesBtn.textContent = 'Replace Images';
replaceImagesBtn.style.marginBottom = '5px';
replaceImagesBtn.onclick = () => {
  replaceImagesWithPlaceholder();
};

// Create the "Replace Videos" button
const replaceVideosBtn = document.createElement('button');
replaceVideosBtn.textContent = 'Replace Videos';
replaceVideosBtn.style.marginBottom = '5px';
replaceVideosBtn.onclick = () => {
  replaceVideosWithPlaceholder();
};

// Create the "Reset" button
const resetBtn = document.createElement('button');
resetBtn.textContent = 'Reset';
resetBtn.onclick = () => {
  location.reload(); // Reload the page to restore original styles/content
};

// Append buttons to the control panel
controlPanel.appendChild(removeInlineBtn);
controlPanel.appendChild(document.createElement('br'));
controlPanel.appendChild(removeClassBtn);
controlPanel.appendChild(document.createElement('br'));
controlPanel.appendChild(replaceTextBtn);
controlPanel.appendChild(document.createElement('br'));
controlPanel.appendChild(replaceImagesBtn);
controlPanel.appendChild(document.createElement('br'));
controlPanel.appendChild(replaceVideosBtn);
controlPanel.appendChild(document.createElement('br'));
controlPanel.appendChild(resetBtn);

// Add a description paragraph below all buttons
const desc = document.createElement('p');
desc.textContent = 'This plugin removes visual styles and content structure from a webpage, replacing it with placeholder text and images for experimental or accessibility review purposes.';
desc.style.marginTop = '10px';
desc.style.fontSize = '12px';
desc.style.color = '#333';
controlPanel.appendChild(desc);

// Wrap the control panel in a container with a unique ID and Shadow DOM
const host = document.createElement('div');
host.id = 'style-remover-controls';
document.body.appendChild(host);

const shadowRoot = host.attachShadow({ mode: 'open' });

const style = document.createElement('style');
style.textContent = `
  * {
    font-family: 'Times New Roman', serif;
    font-size: 1rem;
    box-sizing: border-box;
  }
  button {
    margin-bottom: 5px;
    width: 100%;
  }
  p {
    margin-top: 10px;
    font-size: 12px;
    color: #333;
  }
`;

shadowRoot.appendChild(style);
shadowRoot.appendChild(controlPanel);

// --- Draggable Control Panel Logic ---
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

controlPanel.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - controlPanel.getBoundingClientRect().left;
  offsetY = e.clientY - controlPanel.getBoundingClientRect().top;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;
  controlPanel.style.left = `${x}px`;
  controlPanel.style.top = `${y}px`;
  controlPanel.style.right = 'auto'; // disable right to allow left to work
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
  }
});
