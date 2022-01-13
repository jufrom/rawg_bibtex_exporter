let startExport = document.getElementById("startExport");
let citation_text_view = document.getElementById("citation_text_view");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message === 'update-citation-text') {
		chrome.storage.local.get("citation_text", ({ citation_text }) => {
		   citation_text_view.innerHTML = citation_text;
		});
		//citation_text_view.innerHTML = citation_text;
	}
});

// When the button is clicked, inject startExportScript into current page
startExport.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startExportScript,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
function startExportScript() {
	try {
		var game_titles = document.getElementsByClassName("heading heading_1 game__title");
		if(game_titles.length > 1) {
			console.log("multiple titles found");
		}
		else {
			var game_title = game_titles[0].textContent;
		}
		let game_info = document.getElementsByClassName("game__meta-block");
		var publisher = null;
		var developer = null;
		var release_date = null;
		var platforms = null;
		for (var i = 0; i < game_info.length; i++) { 

			let game_info_type = game_info[i].firstChild.innerText; 
			let game_info_text = game_info[i].children[1].innerText;
			switch (game_info_type) {
				case "Publisher":
					var publisher = game_info_text;
					break;
				case "Developer":
					var developer = game_info_text;
					break;
				case "Release date":
					var release_date = game_info_text;
					break;
				case "Platforms":
					var platforms = game_info_text;
					break;
				default: 
					break;
			}
		}
		let key_name = game_title.replace(/ /g,"_").toLowerCase() + "_game_bib";
		let release_date_parsed = new Date(release_date);
		let release_date_day = release_date_parsed.getDate();
		let release_date_month = release_date_parsed.getMonth() + 1;
		let release_date_year = release_date_parsed.getFullYear();
		let citation_text = `@misc{${key_name},
			title={${game_title}},
			howpublished = {Game [${platforms}]},
			author = {${developer}},
			day = {${release_date_day}},
			month = {${release_date_month}},
			year = {${release_date_year}},
			publisher= {${publisher}}
		}`;
		console.log(citation_text);
		chrome.storage.local.set({ citation_text });
		chrome.runtime.sendMessage('update-citation-text');
	} catch (error) {
		let citation_text = "Error while exporting: " + error.message;
		console.log(citation_text);
		chrome.storage.local.set({ citation_text });
		chrome.runtime.sendMessage('update-citation-text');
	}
}