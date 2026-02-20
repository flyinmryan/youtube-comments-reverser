const API_KEY = "YOUTUBE_DATA_API_KEY"; 

document.getElementById("runBtn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("v=")) {
    status.innerText = "Open a video first!";
    return;
  }

  const urlParams = new URLSearchParams(new URL(tab.url).search);
  const videoId = urlParams.get("v");

  status.innerText = "Fetching comments...";
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: loadCommentsViaAPI,
    args: [videoId, API_KEY]
  });
});

async function loadCommentsViaAPI(videoId, apiKey) {
    console.log("Starting Turbo Load (Relevance Order)...");
    
    async function fetchComments(pageToken = "") {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&textFormat=plainText&maxResults=100&order=relevance&videoId=${videoId}&key=${apiKey}&pageToken=${pageToken}`;
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    try {
        let allComments = [];
        let nextPageToken = "";
        let totalFetched = 0;

        do {
            const data = await fetchComments(nextPageToken);
            
            if (data.error) {
                alert("API Error: " + data.error.message);
                return;
            }

            if (!data.items) break;

            allComments.push(...data.items);
            totalFetched += data.items.length;
            nextPageToken = data.nextPageToken;
            
            console.log(`Fetched ${totalFetched} comments...`);
        } while (nextPageToken && totalFetched < 20000); 

        const container = document.querySelector("#comments #contents");
        if (!container) {
            alert("Could not find comment section. Scroll down once to initialize it.");
            return;
        }
        container.innerHTML = ""; 

        let htmlString = "";
        
        // REVERSE loop (Last item fetched -> First item shown)
        for (let i = allComments.length - 1; i >= 0; i--) {
            const item = allComments[i];
            console.log(item);
            const comment = item.snippet.topLevelComment.snippet;
            
            htmlString += `
                <div style="display:flex; margin-bottom: 20px; font-family: Roboto, Arial; color: #f1f1f1; font-size: 14px;">
                    <img src="${comment.authorProfileImageUrl}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 16px;">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${comment.authorDisplayName}</div>
                        <div style="line-height: 1.4;">${comment.textDisplay}</div>
                    </div>
                </div>
            `;
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = htmlString;
        container.appendChild(wrapper);

        alert(`Success! Reversed ${allComments.length} comments`);

    } catch (err) {
        console.error(err);
        alert("Error fetching comments. Check console.");
    }
}