(async function() {
    if (window.ytReverseRunning) return;
    window.ytReverseRunning = true;

    console.log("YT Reverser: Process started.");

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Initial Setup: Find the container
    const commentsSelector = "ytd-comments #contents";
    let container = document.querySelector(commentsSelector);

    // If container isn't there, scroll down to trigger the first load
    if (!container) {
        window.scrollTo(0, 600);
        await wait(1500);
        container = document.querySelector(commentsSelector);
        if (!container) {
            console.error("YT Reverser: Comments section not found.");
            alert("Could not locate comments. Please scroll down manually and try again.");
            window.ytReverseRunning = false;
            return;
        }
    }

    // 2. The Smart Loading Loop
    async function loadAllComments() {
        let retries = 0;
        const maxRetries = 3; // How many times to try if no new comments appear
        let previousCommentCount = 0;

        while (true) {
            // Count current comments
            const currentComments = document.querySelectorAll("ytd-comment-thread-renderer");
            const count = currentComments.length;

            console.log(`YT Reverser: Currently loaded ${count} comments.`);

            // Check if we found the spinner (loading icon)
            const spinner = document.querySelector("ytd-continuation-item-renderer");

            // Exit Condition:
            // If we have comments, but the count hasn't changed for 'maxRetries' loops, we are done.
            if (count > 0 && count === previousCommentCount) {
                retries++;
                console.log(`YT Reverser: No new comments found (Attempt ${retries}/${maxRetries})`);
                
                if (retries >= maxRetries) {
                    console.log("YT Reverser: Finished loading (or timed out).");
                    break;
                }
            } else {
                // Reset retries if we successfully found new comments
                retries = 0;
                previousCommentCount = count;
            }

            // Scroll Logic
            if (spinner) {
                // Scroll the spinner into view
                spinner.scrollIntoView({ behavior: 'auto', block: 'center' });
            } else {
                // Hard scroll to bottom if no spinner is found (sometimes it hides)
                window.scrollTo(0, document.documentElement.scrollHeight);
            }

            // "Nudge" Scroll:
            // YouTube sometimes ignores a static scroll. We scroll up slightly and back down
            // to force the 'intersection observer' to trigger a fetch.
            await wait(100); 
            window.scrollBy(0, -100);
            await wait(100);
            window.scrollTo(0, document.documentElement.scrollHeight);

            // Wait for network response (2 seconds is usually safe for YT)
            await wait(2000);
        }
    }

    // Run the loader
    await loadAllComments();

    // 3. Reverse Logic
    console.log("YT Reverser: Reversing DOM nodes...");
    
    // Refresh the container reference just in case
    container = document.querySelector(commentsSelector);
    const commentNodes = container.querySelectorAll("ytd-comment-thread-renderer");
    const commentsArray = Array.from(commentNodes);

    if (commentsArray.length > 0) {
        // Append in reverse order (moving them from bottom to top)
        for (let i = commentsArray.length - 1; i >= 0; i--) {
            container.appendChild(commentsArray[i]);
        }
        
        // Scroll user to the top of the comment section to see the "First" comment
        const header = document.querySelector("ytd-comments-header-renderer");
        if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    console.log(`YT Reverser: Complete. Reversed ${commentsArray.length} comments.`);
    window.ytReverseRunning = false;
})();