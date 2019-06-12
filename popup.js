pageRefresh();

function pageRefresh(){
	chrome.storage.local.get('loginState', function(items){
		if(items.loginState === undefined || items.loginState == false){
			var x = document.getElementById("addSite");
			x.style.display = "none";
			x = document.getElementById("getData");
			x.style.display = "none";
			x = document.getElementById("login");
			x.style.display = "block";
		}
		else{
			chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
				var url = tabs[0].url;
				isSiteMonitored(url, function(result){
					if(result == true) {
						var x = document.getElementById("addSite");
						x.style.display = "none";
						x = document.getElementById("login");
						x.style.display = "none";
						x = document.getElementById("getData");
						x.style.display = "block";
					}
					else {
						var x = document.getElementById("login");
						x.style.display = "none";
						x = document.getElementById("getData");
						x.style.display = "none";
						x = document.getElementById("addSite");
						x.style.display = "block";
						
					}
				});
			});
		}
	});
}



function isSiteMonitored(URL, cb) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status >= 200) {
			var obj = JSON.parse(this.responseText);
			var index = -1;
			for(var i=0; i<obj.results.length; i++){
				if(obj.results[i].url == URL){
					index = i;
				}
			}
			if(index != -1){
				cb(true);
			}
			else{
				cb(false);
			}
       }
    };
    xhttp.open("GET", "https://api.up.hamravesh.ir/api/v1/monitors/", true);
	chrome.storage.local.get('Token', function(items){
		xhttp.setRequestHeader("Authorization", "Token " + items.Token);
		xhttp.send();
	});
}



function saveLoginState(jsonObj) {
	var obj = JSON.parse(jsonObj);
	chrome.storage.local.set({ "Token": obj.key }, function(){
		chrome.storage.local.set({ "loginState": true }, function(){
		  });
	  });
}

function postReq(URL, body, token) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status >= 200) {
			if(token != true){
				saveLoginState(this.responseText);
			}
			pageRefresh();
       }
    };
    xhttp.open("POST", URL, true);
	xhttp.setRequestHeader("Content-type", "application/json");
	if(token == true){
		chrome.storage.local.get('Token', function(items){
			xhttp.setRequestHeader("Authorization", "Token " + items.Token);
			xhttp.send(JSON.stringify(body));
		});
	}
	else{
		xhttp.send(JSON.stringify(body));
	}
}

function getReqmetric(URL) {
	var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status >= 200) {
			var obj = JSON.parse(this.responseText);
			var tableRow = "";
			for(var i=0; i<obj.probers.length; i++){
				tableRow += "<tr style=\"border: 1px solid #ccc;\">\
					<td>"+obj.probers[i].name+"</td><td><i>"+obj.probers[i].timing.resolve+" ms</i></td><td><i>"+obj.probers[i].timing.connect+" ms</i></td><td><i>"+obj.probers[i].timing.tls+" ms</i></td><td><i>"+obj.probers[i].timing.response+" ms</i></td>\
				</tr>";
			}
			htmlTable = "<table style=\"border-spacing: 10px;\">\
			<tbody>"
				+ tableRow +
				"</tbody>\
			</table>"
			document.getElementById("res").innerHTML = htmlTable;
       }
    };
    xhttp.open("GET", URL, true);
	chrome.storage.local.get('Token', function(items){
		xhttp.setRequestHeader("Authorization", "Token " + items.Token);
		xhttp.send();
	});
	
}

function getReq(URL, targetURL, token) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status >= 200) {
			var obj = JSON.parse(this.responseText);
			var index = -1;
			for(var i=0; i<obj.results.length; i++){
				if(obj.results[i].url == targetURL){
					index = i;
				}
			}
			getReqmetric("https://api.up.hamravesh.ir/api/v1/monitors/"+obj.results[index].id.toString()+"/metric");
			pageRefresh();
       }
    };
    xhttp.open("GET", URL, true);
	xhttp.setRequestHeader("Content-type", "application/json");
	if(token == true){
		chrome.storage.local.get('Token', function(items){
			xhttp.setRequestHeader("Authorization", "Token " + items.Token);
			xhttp.send();
		});
	}
	else{
		xhttp.send();
	}
}

function login(email, password) {
	chrome.cookies.getAll({ domain: '.api.up.hamravesh.ir'},
	  function (cookies) {
		if (cookies.length !== 0) {
			for(var i=0; i<cookies.length;i++) {
				chrome.cookies.remove({url: "https://api.up.hamravesh.ir" + cookies[i].path, name: cookies[i].name});
			}
			postReq("https://api.up.hamravesh.ir/api/v1/users/login", {email: email, password: password}, false);
		}
		else {
			postReq("https://api.up.hamravesh.ir/api/v1/users/login", {email: email, password: password}, false);
		}
	});
}

function simpleGetReq(URL, cb) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status >= 200) {
			cb(xhttp.responseText);
       }
    };
    xhttp.open("GET", URL, true);
	xhttp.send();
}

function addSite(url, aliasText, period, apdex, probes, alerting, Method, key, value) {
	simpleGetReq("https://api.up.hamravesh.ir/api/v1/probers/", function(responseText) {
		var obj = JSON.parse(responseText);
		var index = [];
		var probes_final = []
		for(var i=0; i<probes.length; i++){
			for(var j=0; j<obj.results.length; j++){
				if(probes[i].value == obj.results[j].name){
					index.push(j);
					probes_final.push(obj.results[j]);
				}
			}
		}
		var header = {}
		for(var i=0; i<key.length; i++){
			header[key[i]] = value[i];
		}
		body = {"url":url,
		"alias":aliasText,
		"protocol_type":"HTTP",
		"period":parseInt(period),
		"apdex":parseInt(apdex),
		"host":null,
		"probers":probes_final,
		"alert":{"emails":[],
		"phones":[],
		"telegram_usernames":[],
		"bale_usernames":[]},
		"http_headers":header,
		"http_method":Method}
		chrome.cookies.getAll({ domain: '.api.up.hamravesh.ir'},
		  function (cookies) {
			if (cookies.length !== 0) {
				for(var i=0; i<cookies.length;i++) {
					chrome.cookies.remove({url: "https://api.up.hamravesh.ir" + cookies[i].path, name: cookies[i].name});
				}
				postReq("https://api.up.hamravesh.ir/api/v1/monitors/", body, true);
			}
			else {
				postReq("https://api.up.hamravesh.ir/api/v1/monitors/", body, true);
			}
		});
	});
}

function getWebsiteData(url) {
	chrome.cookies.getAll({ domain: '.api.up.hamravesh.ir'},
	  function (cookies) {
		if (cookies.length !== 0) {
			for(var i=0; i<cookies.length;i++) {
				chrome.cookies.remove({url: "https://api.up.hamravesh.ir" + cookies[i].path, name: cookies[i].name});
			}
			getReq("https://api.up.hamravesh.ir/api/v1/monitors/", url, true);
		}
		else {
			getReq("https://api.up.hamravesh.ir/api/v1/monitors/", url, true);
		}
	});
	
}


function openTab(tabName, btnName) {
	var i, tabcontent, tablinks;
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	document.getElementById(tabName).style.display = "block";
	document.getElementById(btnName).className += " active";
}

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}


document.addEventListener('DOMContentLoaded', function() {
    var checkPageButton = document.getElementById('clickIt');
	var AliasBtn = document.getElementById('AliasBtn');
	var ParamBtn = document.getElementById('ParamBtn');
	var MethodBtn = document.getElementById('MethodBtn');
	var HeaderBtn = document.getElementById('HeaderBtn');
	var addHeaderRowBtn = document.getElementById('addHeaderRow');
	
	
	
	addHeaderRowBtn.addEventListener('click', function() {
		document.getElementById("headerForm").innerHTML += document.getElementById("headerRow").innerHTML; 
	}, false);
	
	AliasBtn.addEventListener('click', function() {
		openTab("Alias", "AliasBtn");
	}, false);
	ParamBtn.addEventListener('click', function() {
		openTab("Param", "ParamBtn");
	}, false);
	MethodBtn.addEventListener('click', function() {
		openTab("Method", "MethodBtn");
	}, false);
	HeaderBtn.addEventListener('click', function() {
		openTab("Header", "HeaderBtn");
	}, false);
	
    checkPageButton.addEventListener('click', function() {

  
		chrome.storage.local.get('loginState', function(items){
			if(items.loginState === undefined || items.loginState == false){
				var email = document.getElementById('email').value
				var password = document.getElementById('password').value
				login(email, password);
			}
			else{
				chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
					var url = tabs[0].url;
					isSiteMonitored(url, function(result){
						if(result == true) {
							getWebsiteData(url);
						}
						else {
							var aliasText = document.getElementById('aliasText').value
							var period = document.getElementById('period').value
							var apdex = document.getElementById('apdex').value
							var probes = getSelectValues(document.getElementById('probes'));
							var alerting = document.getElementById('alerting').value
							var Method = document.getElementById('methodSelect').value
							var keyClass = document.getElementsByClassName("key");
							var key = [];
							var value = [];
							for (i = 0; i < key.length; i++) {
								key.push(keyClass[i].value);
							}
							var valueClass = document.getElementsByClassName("value");
							for (i = 0; i < key.length; i++) {
								value.push(valueClass[i].value);
							}
							addSite(url, aliasText, period, apdex, probes, alerting, Method, key, value);
						}
					});
				});
			}
		});
		

    }, false);
  }, false);