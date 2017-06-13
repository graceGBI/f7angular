/**
    Axelib.js 
    Mobile Backend Library to interact with Axelib Server
*/

(function (doc, win) {
	
	'use strict';
	
	var user = {};
	var token = {};
	var ax_logs = [];
	var ax_color = "";
	var ax_dev = false;
	var ax_retry = 0;
	var ax_iteration = 0;
	var ax_log_persistent = true;
	var ax_retry_methods = [];
	
    var axelib = function (e) {
		
		if (!e.code) console.warn(txt.nocode);
		
		if (e.debug) ax_dev = true;
		
		this.code      = e.code ? e.code : "YOUR_PROJECT_CODE";
		this.title     = e.name ? e.name : "Axelib";
        this.retry     = e.retry ? e.retry : 3;
		this.timeout   = e.timeout ? e.timeout : 25000;
        this.version   = e.version ? e.version : '0.1';
		this.active    = e.active ? e.active : '#ea6a49';
		
		this.retry_methods = ["login"];
		this.coreURL = "https://api.axelib.com/";
        
        /**
            Credential state : 
        */
        this.cred_ctx = null;        //"no_creds", "has_creds_online", "has_creds_conn_last", "has_creds_offline"
        this.token_ctx = "no_token"; //default value. Others : "has_token", "token_expired"
        this.conn_status = null;
		
		ax_color = this.active;
		ax_retry = this.retry;
		ax_retry_methods = this.retry_methods;
		this.ajx = ajax.init();
		
		this.gett = function() {
			return "a";
		};
		
		this.tools = tools;
		this.events = events;
        this.store = store;
		//this.Base64 = Base64;
		
		tools.appendCssModal({
			popmsgclr: this.active
		});
		
		if (ax_dev) tools.enableLog();

		/************  E V E N T S  ***************/

        window.addEventListener('load', function() {
            
            window.addEventListener('online', events.onlineStatus);
            window.addEventListener('offline', events.onlineStatus);
            //Pure Axelib Events
			window.addEventListener('app_login', events.appLogin);
			window.addEventListener('app_logout', events.appLogout);
			window.addEventListener('app_start', events.appStart);
			window.addEventListener('app_first_start', events.appFirstStart);
			window.addEventListener('token_expiration', events.appTokenExpiration);
			//Document events : ready / resume
			document.addEventListener("resume", events.appResume, false);
            document.addEventListener('deviceready', events.deviceReady, false);
            
        });
    };
	
    axelib.get_token = function () { return token; };
	
	function get_color() { 
		return Axelib.gett(); 
	};
	
	var txt    = {nointernet:"No internet connexion detected !",timesout:"The request timed out !",errorserver:"The last action failed on server !",userexists:"Sorry this user already exist !",wrongcredentials:"Login or password incorrect !",noright:"You dont have the rights to do this action",tokenexpired:"Your session expired, please login",facebookapierror:"Facebook API connexion failed",okbutton:"Ok",nocode:"Warning : You did not give your Axelib project code !!!",fb_fail:"Facebook login failed !",notparsable:"Server response is not parsable !",backend_error:"Une erreur s'est produite au niveau de la BDD",unexpected:"Unexpected error !!!"};
	var events = {
		trigger: function(EvtName, EvtMessage) {
			switch(EvtName) {
				case "app_start":
				case "app_login":
				case "app_logout":
				case "app_first_start":
				case "token_expiration":
					var evt = new CustomEvent(EvtName, { detail: EvtMessage });
					window.dispatchEvent(evt);
					break;
			}
		},
        deviceReady: function(e) {
            console.log('Device is ready ! : ', e.detail);
            var start = store.get("first_start");
            if (start !== undefined)
                events.trigger("app_start");
            else {
                store.set("first_start", false);
                events.trigger("app_first_start");
            }
        },
		appLogin: function(e) {
			var exist_storage = (window.localStorage !== undefined);
			console.log('Login to app : ', e.detail);
            Axelib.prototype.user = e.detail.user;
			if (exist_storage) store.set("token", token);
			registerForToken();
		},
		appLogout: function(e) {
			console.log('Logout from app : ', JSON.stringify(e.detail));//.detail);
		},
        appResume: function(e) {
            console.log('App resumes : ', e.detail);
        },
		appStart: function(e) {
			console.log('App has start : ', e.detail);
		},
		appFirstStart: function(e) {
			console.log('App first start : ', e.detail);
		},
		appTokenExpiration: function(e) {
			console.log('Token is expired : ', e.detail);
			//window.location.reload();
			Axelib.prototype.popupmessage({
				message: "<div class='material-icons'>&#xE88F;</div>" + txt.tokenexpired, 
				position: 1,
				timer: 2000
			});
		},
        onlineStatus: function(e) {
            console.log("erooooo" + JSON.stringify(e));
        }
	};
	var ajax = {
		init: function() {
			var obj = {}, self = this;
			var ajax = function() {
				this.type   = "json";
				this.type	= "POST";
			};
			ajax.prototype.run = function(arr) {
				if (navigator.onLine) self.request(arr, this);
				else arr.nointernet();
			};
			ajax.prototype.success = function(result, Method, Entity, success, error) {
				self.success(result, Method, Entity, success, error);
			};
			ajax.prototype.fail = function(err, Method, Entity, error) {
				self.fail(err, Method, Entity, error);
			};
			var my_ajax = function() { ajax.call(this); };			
			my_ajax.prototype = Object.create(ajax.prototype);
			my_ajax.prototype.constructor = my_ajax;
			obj = new my_ajax();
			return obj;
		},
		request: function(arr) {
			var data_array, data_string, idx, xhr, value, myData = null;
			var uuid = (window.device===undefined) ? null : window.device.uuid;
			var formData = (window.FormData === undefined) ? null : new FormData();
			if (arr.data == null) arr.data = {};
			if (arr.success == null) arr.success = function () { };
			if (!arr.type || arr.type == null) arr.type = 'POST';
			data_array = [];
			if ((arr.data instanceof FormData) == true) {
				myData = arr.data
			} else {
				for (idx in arr.data) {
					value = arr.data[idx];
					var value_clean = encodeURIComponent(value);
					data_array.push("" + idx + "=" + value_clean);
				}
				data_string = data_array.join("&");
				myData = data_string;
			}
			xhr = new XMLHttpRequest();
			xhr.open(arr.type, arr.url, true);
			if (uuid != null) arr.headers["uuid"] = uuid;
			for (idx in arr.headers) xhr.setRequestHeader(idx, arr.headers[idx]);
			xhr.timeout = arr.timeout;
			xhr.ontimeout = arr.timesout;
			xhr.onreadystatechange = function () {
				if(this.readyState == 4) {
					if(this.status == 200) {
						var rema = Axelib.prototype.isJsonString(xhr.responseText) ? JSON.parse(xhr.responseText) : txt.notparsable;
						if (typeof rema == "object" && ax.hasKey(rema[arr.entity], "error") && rema[arr.entity].error) arr.error(rema);
						return arr.success(rema);
					}
					else if(this.status == 404) {
						return arr.error(txt.backend_error);
					}
					else if(this.status == 500) {
						return arr.error(txt.backend_error);
					}
					else if(this.status == 503) {
						return arr.error(txt.backend_error);
					}
					else {
						return arr.error(Axelib.prototype.isJsonString(xhr.responseText) ? JSON.parse(xhr.responseText) : txt.notparsable);
					}
				}
			};
			xhr.upload.addEventListener('progress', function(e){
				//showUpload(e);
			}, false);
			xhr.send(myData);
			return xhr;
		},
		success: function(result, Method, Entity, success, error, startTime) {
			var res = (result && Axelib.prototype.hasKey(result, Entity)) ? result[Entity] : result, time = 0, endTime = new Date();
			time = (endTime.getTime() - startTime.getTime()) / 1000;
			if ( (res || (res && res.success)) && !res.error ) {
				if (Method == "login" && Entity == "user") {
					user = res.user;
					token.val = res.token;
					token.exp = res.exp;
				}
				if (success && success != null)
					success(res, time);
			}
			else {
				if (error == null) { 
					if(!result || result == null) Axelib.prototype.log({message: txt.unexpected, type:1});
					else Axelib.prototype.log({message: (result.message || null), type: (result.error?1:0)});
				}
				else error((result && Axelib.prototype.hasKey(res, "message")) ? res.message : null, time);
			}
		},
		fail: function(err, Method, Entity, error, startTime, Data) {
			var time = 0, endTime = new Date();
			time = (endTime.getTime() - startTime.getTime()) / 1000;
			if( !navigator.onLine ) this.nointernet();
			else {
				if( (ax_retry_methods.indexOf(Method) >= 0) && (ax_iteration < ax_retry) ) {
					axelib.iteration++;
                    if (Data)
					    Axelib.prototype.login(Data.email, Data.password);
				}
				else if (typeof err == "object") {
					for (var key in err) {
						if (Axelib.prototype.hasKey(err[key], "token_error")) {
							token = {};
							store.del("token");
                            
                            events.trigger("token_expiration");
                            
							if (error)
								error(err, time);
							break;
						}
					}
				}
				else {
					axelib.iteration = 0;
					if (typeof(err) == "undefined") { error(err, time); return }
					else if (typeof(err) == "string") { var ax_temp = err; err = {}; err.responseText = ax_temp };
					err.responseText = Axelib.prototype.hasKey(err, "responseText") ? err.responseText : JSON.stringify(err || '');/**/
					Axelib.prototype.log({message: err.responseText, type: 1});//console.warn(err.responseText);
					Axelib.prototype.popupmessage({
						message: "<div class='material-icons'>&#xE88F;</div>" + txt.errorserver, 
						position: 1,
						timer: 2000
					});
					if (error)
						error(err, time);
				}
			}
		},
		nointernet: function(e, startTime) {
			var time = 0, endTime = new Date();
			time = (endTime.getTime() - startTime.getTime()) / 1000;
			Axelib.prototype.popupmessage({
				message: "<div class='material-icons'>&#xE88F;</div>" + txt.nointernet, 
				position: 1,
				timer: 2000
			});
			if(e) e(txt.nointernet, time);
		},
		timesout: function(e, startTime) {
			var time = 0, endTime = new Date();
			time = (endTime.getTime() - startTime.getTime()) / 1000;
			Axelib.prototype.popupmessage({
				message: "<div class='material-icons'>" + txt.timesout, 
				position: 1,
				timer: 2000
			});
			if(e) e(txt.timesout, time);
		}
	};
    var tools={DURATION_IN_SECONDS:{epochs:['year','month','day','hour','minute'],year:31536000,month:2592000,day:86400,hour:3600,minute:60},getDuration:function(seconds){var epoch,interval;for(var i=0;i<axelib.DURATION_IN_SECONDS.epochs.length;i++){epoch=axelib.DURATION_IN_SECONDS.epochs[i];interval=Math.floor(seconds/axelib.DURATION_IN_SECONDS[epoch]);if(interval>=1){return{interval:interval,epoch:epoch}}}},timeSince:function(date){var seconds=Math.floor((new Date()-new Date(date))/1000);var duration=axelib.getDuration(seconds);var suffix=(duration.interval>1||duration.interval===0)?'s':'';return duration.interval+' '+duration.epoch+suffix},TsFromDate:function(d){var ts=parseInt(d.getTime()/1000);return ts},DateFromTs:function(ts){var a=ts.toString();if(a.length<13)ts=ts*1000;var d=new Date(ts);return d},dateFromString:function(dateItems,formatItems){var monthIndex=formatItems.indexOf("mm");var dayIndex=formatItems.indexOf("dd");var yearIndex=formatItems.indexOf("yyyy");var hourIndex=formatItems.indexOf("hh");var minutesIndex=formatItems.indexOf("ii");var secondsIndex=formatItems.indexOf("ss");var today=new Date();var year=yearIndex>-1?dateItems[yearIndex]:today.getFullYear();var month=monthIndex>-1?dateItems[monthIndex]-1:today.getMonth()-1;var day=dayIndex>-1?dateItems[dayIndex]:today.getDate();var hour=hourIndex>-1?dateItems[hourIndex]:today.getHours();var minute=minutesIndex>-1?dateItems[minutesIndex]:today.getMinutes();var second=secondsIndex>-1?dateItems[secondsIndex]:today.getSeconds();return new Date(year,month,day,hour,minute,second)},dateToStringMysql:function(date){var month=''+(date.getMonth()+1),day=''+date.getDate(),year=date.getFullYear(),hour=date.getHours(),min=date.getMinutes(),sec=date.getSeconds();if(month.length<2||month<10)month='0'+month;if(day.length<2||day<10)day='0'+day;if(hour.length<2||hour<10)hour='0'+hour;if(min.length<2||min<10)min='0'+min;if(sec.length<2||sec<10)sec='0'+sec;return[year,month,day].join('-')+' '+[hour,min,sec].join(':')},preFormatFB:function(response,fb_token){try{response.fb_token=fb_token;if(Axelib.prototype.hasKey(response,"birthday"))response.birthday=Axelib.prototype.toDate(response.birthday,"MM/dd/yyyy");if(Axelib.prototype.hasKey(response,"updated_time")){response.updated_time=response.updated_time.substring(0,response.updated_time.length-5);response.updated_time=response.updated_time.replace("T"," ");response.updated_time=Axelib.prototype.toDate(response.updated_time,"yyyy-MM-dd hh:ii:ss");response.updated_time=this.dateToStringMysql(response.updated_time)}}catch(e){alert(JSON.stringify(e))}return response},appendCssModal:function(params){this.popmsgclr=params.popmsgclr?params.popmsgclr:'red';var style=document.createElement('style');style.type='text/css';var cssStyle='';cssStyle+=' .ax-window { color:#111; width:100%; height:100%; position:fixed; top:0; right:0; margin:0px; z-index:9999999999; background-color:rgba(0,0,0, 0.7); text-align:center; padding-top:70px; animation-name: example; -webkit-animation-duration: 0.2s; animation-duration: 0.2s; } ';cssStyle+=' .ax-window-box {background-color:#FFF; max-width:350px; width:90%; margin:0 auto; padding:10px 0px;} ';cssStyle+=' .ax-window-btn { background-color:#AAAAAA; text-transform:uppercase; margin:5px 10px 0px 10px; cursor:pointer; padding:10px; color:#FFF; font-size:14px; } ';cssStyle+=' .ax-window-btn.activated { background-color:'+ax_color+'; } ';cssStyle+=' .ax-window-btn:active { background-color:#555; } ';cssStyle+=' #ax-window-msg { font-size: 20px; padding-bottom:12px; } ';cssStyle+=' .popupmsg { position:absolute; width:100%; background-color:'+this.popmsgclr+'; color:#FFF; -webkit-box-sizing: content-box; box-sizing: content-box; } ';cssStyle+=' .popupmsg.on-top { top:0px; padding:10px 0px 10px 0px; height:25px; line-height:25px; } ';cssStyle+=' .popupmsg.on-bot { bottom:0px; padding:10px 0px 10px 0px; height:25px; line-height:25px; } ';cssStyle+=' .popupmsg div.material-icons { position:absolute; left:10px; top:30px; } ';cssStyle+=' @-webkit-keyframes example { from {opacity: 0;} to {opacity: 1;} } ';cssStyle+=' @keyframes example { from {opacity: 0;} to {opacity: 1;} } ';cssStyle+=' .ax-log { width:90%; max-width:500px; height:250px; background-color:#000; margin:0 auto; border-radius:3px; } ';cssStyle+=' .ax-log-header { margin:0; height:25px; line-height:25px; background-color:#FFF; color:#000; text-align:left; text-indent:10px; } ';cssStyle+=' .ax-log-header span { float: right; cursor: pointer; margin-right: 3px; text-indent: 0; } ';cssStyle+=' .ax-log-header span i { border: solid 1px #000; padding: 0 6px; font-style:normal; } ';cssStyle+=' .ax-log-body { overflow-y: scroll !important; overflow-y: hidden; height: calc(100% - 25px); } ';cssStyle+=' .ax-log-body ul { list-style-type:none; padding-left:10px; } ';cssStyle+=' .ax-log-body ul li { color:#CCC; text-align: left; } ';cssStyle+=' .ax-log-body ul li span { float:right; margin-right:8px; font-size:12px; } ';cssStyle+=' .ax-log-body ul li.ax-err { color:#F00 } ';cssStyle+=' .ax-show-log { position:fixed; top:50%; right:0; width:30px; height:30px; line-height:30px; text-align:center; color:#FFF; background-color:#000; cursor:pointer; z-index: 99999; } ';cssStyle+=' div.spin_on { margin: 0 auto;padding: 0-webkit-animation-name: spin;-webkit-animation-duration: 800ms;-webkit-animation-iteration-count: infinite;-webkit-animation-timing-function: linear;-moz-animation-name: spin;-moz-animation-duration: 800ms;-moz-animation-iteration-count: infinite;-moz-animation-timing-function: linear;-ms-animation-name: spin;-ms-animation-duration: 800ms;-ms-animation-iteration-count: infinite;-ms-animation-timing-function: linear;animation-name: spin;animation-duration: 800ms;animation-iteration-count: infinite;animation-timing-function: linear;color: #FFF !important;font-size: 35px;text-align: center; } ';cssStyle+=' @-ms-keyframes spin { from { -ms-transform: rotate(0deg); } to { -ms-transform: rotate(-360deg); }} ';cssStyle+=' @-moz-keyframes spin { from { -moz-transform: rotate(0deg); } to { -moz-transform: rotate(-360deg); }} ';cssStyle+=' @-webkit-keyframes spin { from { -webkit-transform: rotate(0deg); }    to { -webkit-transform: rotate(-360deg); }} ';cssStyle+=' @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(-360deg); }} ';cssStyle+=' .ax-btm { position: fixed; bottom: 0; } ';if(this.device.ios()){cssStyle+=' .bonus_header { height:20px !important; background-color:#9b59b6 } ';cssStyle+=' .popupmsg.on-top { top:0px; padding:10px 0px 10px 0px; height:55px; line-height:75px; } ';cssStyle+=' .popupmsg div.material-icons { top:35px; } ';cssStyle+=' .ax-btm { bottom: 20px; } '}else if(this.device.android()){cssStyle+=' .popupmsg.on-top { top:0px; padding:10px 0px 10px 0px; height:35px; line-height:35px; } ';cssStyle+=' .popupmsg div.material-icons { top:15px; } '}cssStyle+='  ';cssStyle+='  ';style.innerHTML=cssStyle;document.getElementsByTagName('head')[0].appendChild(style)},hexFromColor:function(strColor){var myColor="";switch(strColor){case"red":myColor="#f44336";break;case"pink":myColor="#e91e63";break;case"purple":myColor="#9c27b0";break;case"deeppurple":myColor="#673ab7";break;case"indigo":myColor="#3f51b5";break;case"blue":myColor="#2196f3";break;case"lightblue":myColor="#03a9f4";break;case"cyan":myColor="#00bcd4";break;case"teal":myColor="#009688";break;case"green":myColor="#4caf50";break;case"lightgreen":myColor="#8bc34a";break;case"lime":myColor="#cddc39";break;case"yellow":myColor="#ffeb3b";break;case"amber":myColor="#ffc107";break;case"orange":myColor="#ff9800";break;case"deeporange":myColor="#ff5722";break;case"brown":myColor="#795548";break;case"gray":myColor="#9e9e9e";break;case"bluegray":myColor="#607d8b";break;case"black":myColor="#000000";break;case"turquoise":myColor="#1ABC9C";break;case"emerland":myColor="#2ecc71";break;case"peterriver":myColor="#3498db";break;case"amethyst":myColor="#9b59b6";break;case"wetasphalt":myColor="#34495e";break;case"greensea":myColor="#16a085";break;case"nephritis":myColor="#27ae60";break;case"belizehole":myColor="#2980b9";break;case"wisteria":myColor="#8e44ad";break;case"midnightblue":myColor="#2c3e50";break;case"sunflower":myColor="#f1c40f";break;case"carrot":myColor="#e67e22";break;case"alizarin":myColor="#e74c3c";break;case"clouds":myColor="#ecf0f1";break;case"concrete":myColor="#95a5a6";break;case"orangelight":myColor="#f39c12";break;case"pumpkin":myColor="#d35400";break;case"pomegranate":myColor="#c0392b";break;case"silver":myColor="#bdc3c7";break;case"asbestos":myColor="#7f8c8d";break;default:myColor="#2196f3";break}return myColor},close:function(){var ax_el=document.querySelector("#ix");if(ax_el){ax_el.innerHTML=''}if(ax_dev)this.enableLog()},log:function(txt){console.log(txt)},clearLogs:function(){ax_logs=[];store.del("log");document.querySelector(".ax-log-body ul").innerHTML=""},device:{isDevice:function(){var ret=false;if(navigator.userAgent.match(/Android/i)||navigator.userAgent.match(/webOS/i)||navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPad/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/BlackBerry/i)||navigator.userAgent.match(/Windows Phone/i)){ret=true}return ret},ios:function(){return(!!navigator.userAgent&&/iPad|iPhone|iPod/.test(navigator.userAgent))},android:function(){return(/(android)/i.test(navigator.userAgent))}},enableLog:function(){var html='<div class="ax-show-log">+</div>',self=this;document.querySelector("#ix").innerHTML=html;document.querySelector('.ax-show-log').addEventListener('click',function(event){var a=document.querySelector(".ax-log");if(a==null||a===undefined)Axelib.prototype.openlogs();else self.close()})},};
    var store={get:function(key){var ax_store={};if(localStorage&&localStorage.getItem("ax")){ax_store=localStorage.getItem("ax");ax_store=JSON.parse(ax_store);if(Axelib.prototype.hasKey(ax_store,key))return ax_store[key];else return undefined}else return undefined},set:function(key,value){var ax_store={};if(localStorage&&localStorage.getItem("ax")){ax_store=localStorage.getItem("ax");localStorage.removeItem("ax");ax_store=JSON.parse(ax_store);ax_store[key]=value;localStorage.setItem("ax",JSON.stringify(ax_store))}else if(localStorage){ax_store[key]=value;localStorage.setItem("ax",JSON.stringify(ax_store))}else return undefined},del:function(key){if(localStorage&&localStorage.getItem("ax")){var ax_store=localStorage.getItem("ax");ax_store=JSON.parse(ax_store);localStorage.removeItem("ax");if(Axelib.prototype.hasKey(ax_store,key)){delete ax_store[key];localStorage.setItem("ax",JSON.stringify(ax_store))}}},exists:function(key){this.exist=false;if(localStorage&&localStorage.getItem("ax")){var ax_store=localStorage.getItem("ax");ax_store=JSON.parse(ax_store);if(Axelib.prototype.hasKey(ax_store,key))this.exist=true}return this.exist},reset:function(){localStorage.removeItem("ax")}};

	//var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
	
	function meli() {
		console.log(this.code);
	};
	
	function replaceAll(str, find, replace) {
	  return str.replace(new RegExp(find, 'g'), replace);
	}
	
    // public (shared across instances)
    axelib.prototype = {
        /** 
			Checks if an object has a specific property. Returns a boolean (true/false) (certified)
            - obj : Object
            - key : Property to check
        */
		hasKey: function(obj, key) {
			if (typeof(obj) == "undefined") return false;
			if (typeof(obj) == "object" && obj.length > 0)
				obj = obj[0];
			var keys = Object.keys(obj);
			if (keys.indexOf(key) >= 0) return true;
			else return false;
		},
		/**
			Checks if given string is an email. Returns a boolean (true/false) (certified)
			- email : email address. Ex: axelib.isEmail("demo@axelib.com")
		*/
		isEmail: function (email) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		},
        /**
			Checks if a string is JSON string. Returns a boolean (true/false) (certified)
		*/
		isJsonString: function(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},
		/**
			Converts a string into date following the given format. Returns a date object (certified)
			- _date : Date
			- _format : the format
		*/
		toDate: function (_date, _format) {
			var normalized       = _date.replace(/[^a-zA-Z0-9]/g, '-');
			var normalizedFormat = _format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
			var formatItems      = normalizedFormat.split('-');
			var dateItems        = normalized.split('-');
			return tools.dateFromString(dateItems, formatItems);			
		},
		/**
			Gets the axelib session status and return the token if active (certified)
		*/
		status: function() {
			var ret = { token: false, active: false, exp: new Date() };
			var st = store.get("token");
			if (st) {
				st = JSON.parse(st);
				if(this.hasKey(st, "val")) {
					token = st;
					ret.token = st;
					Axelib.prototype.user = st.usr;
					ret.exp = new Date(st.exp);
					if(ret.exp > new Date())
						ret.active = true;
					else
						store.del("token");
				}
			}
			return ret;
		},
		/**
			To Prompt a Message to the screen (certified)
			- Message : Message that you want to alert
		*/
        alert: function(message) {
            if (navigator && navigator.notification) {
				navigator.notification.confirm(
					message, 	       // message
					null,          	 // callback to invoke with index of button pressed
					axelib.title,  	 // title
					[txt.okbutton]	  // buttonLabels
				);
			}
			else alert(message);
        },
		/**
			Shows a Message (certified)
			- strMessage : Message to show
		*/
		message: function(strMessage, actions) {
			var parent = document.querySelector("#ix"), domID = "45-ibm", eventsCal = [];
			if (strMessage == null)
				tools.close();
			else {
				var html = '<div class="ax-window">'
						 + '	<div class="ax-window-box">'
						 + '		<div id="ax-window-msg"></div>';
				if(actions && typeof(actions) == "object") {
					Object.keys(actions).forEach(function(key, index) {
						var obj = {}, actionCallBack = actions[key].toString().substring(13, actions[key].toString().length-1), str_key = key.replace(/_/gi, ' ');
						actionCallBack = replaceAll(actionCallBack, '"', "'").trim();//replace(/(\r\n|\n|\r)/gm,"");
						html += '<div id="ax-modal-key-' + key + '" onclick="Axelib.tools.close();" class="ax-window-btn activated">' + str_key + '</div>';
						obj[key] = actions[key];
						eventsCal.push(obj);
					});
				}
				html +=	   '		<div onclick="Axelib.tools.close();" class="ax-window-btn">Close</div>'
			    		 + '	</div>'
		    			 + '</div>';
				document.querySelector("#ix").innerHTML = html;
				document.querySelector("#ax-window-msg").innerHTML = strMessage;
				for (var i = 0; i < eventsCal.length; i++) {
					var key = Object.keys(eventsCal[i]).toString();
					document.getElementById("ax-modal-key-" + key).addEventListener('click', eventsCal[i][key]);
				}
			}
		},
		/**
			Shows a Message (certified)
			- msg : Object with message to show
		*/
		popupmessage: function(msg) {
			var self = this;
            var timer = msg.timer ? msg.timer : 1500;
            var position = (msg.position == 1 || msg.position === undefined) ? 'on-top' : 'on-bot';
			var style = 'style="';
            style += msg.txclr ? 'color:' + msg.txclr + '; ' : self.active;
            style += msg.bgclr ? 'background-color:' + msg.bgclr + '; ' : '';
			style += '"';
			var html = '<div class="ax-window">'
					 + '	<div class="popupmsg ' + position + '" ' + style + '>'
					 + '	    ' + msg.message
					 + '	</div>'
					 + '</div>';
			document.querySelector("#ix").innerHTML = html;
			setTimeout(function() {
				tools.close();
			}, timer);
		},
		/**
		*/
		loading: function(ldg) {
			var html = '<div class="ax-window">'
					 + '	<div class="spin_on">&#10033;</div> '//&#x21ba;
					 + '</div>';
			if(ldg) document.querySelector("#ix").innerHTML = html;
			else tools.close();
		},
		/**
		*/
		log: function(axLog) {
			var self = this;
			ax_logs = (ax_log_persistent && store.exists("log")) ? JSON.parse(store.get("log")) : ax_logs;
			if (!ax_log_persistent) store.del("log");
			if (ax_dev) {
				if (axLog) { 
					axLog.date = new Date();
					ax_logs.push(axLog);
					store.set("log", ax_logs);
					self.popupmessage({message:"A new <strong>log</strong> was written ...", position:0, timer:750});
				}
			}
			else {
				if (axLog.type) console.warn(axLog.message);
				else console.log(axLog.message);
			}
		},
		/**
			Remap an object renaming the keys. (UNDERSCORE DEPENDENT) (certified)
			Ex: var map = { "lastname" : "nom", "firstname" : "prenom" };
				axelib.remap(users, map)
		*/
		remap: function(collection, map) {
			try {
				_.now();
				for(var i = 0; i < collection.length; i++) {
					var a = collection[i];
					b = _.reduce(a, function(result, value, key) {
						key = map[key] || key;
						result[key] = value;
						return result;
					}, {});
					collection[i] = b;				
				}
			}
			catch(e) {
				console.warn("underscore is not available");
                return collection;
			}
			return collection;
		},
		/**
		*/
		openlogs: function() {
			var self = this, html = '';
			html += '<div class="ax-window"><div class="ax-log"><div class="ax-log-header">Logs<span class="close_log"><i>&#8211;</i></span><span class="erase_log"><i>&#10006;</i></span></div><div class="ax-log-body"><ul></ul></div></div></div>';
			document.querySelector("#ix").innerHTML = html;
			document.querySelector('.ax-log-header span.close_log i').addEventListener('click', function(event) { tools.close(); });
			document.querySelector('.ax-log-header span.erase_log i').addEventListener('click', function(event) { tools.clearLogs(); });
			var ul = document.querySelector(".ax-log-body ul");
			ax_logs = (ax_log_persistent && store.exists("log")) ? JSON.parse(store.get("log")) : ax_logs;
			ax_logs.sort(function(a, b) { return new Date(b.date) - new Date(a.date); }); //order
			for(var i = 0; i < ax_logs.length; i++) {
				var node = document.createElement("li");
				var itemClass = ax_logs[i].type ? 'ax-err' : '';
				ax_logs[i].date = (typeof(ax_logs[i].date) == "date") ? ax_logs[i].date : new Date(ax_logs[i].date);
				var ax_log_date = tools.dateToStringMysql(ax_logs[i].date);
				node.innerHTML = ax_logs[i].message + '<span class="' + itemClass + '">' + ax_log_date + '</span>';
				node.setAttribute("class", itemClass);
				ul.appendChild(node);
			}
		},
		//C O N N E C T E D    M E T H O D S
		/**
			This is the main function that calls the server
			- Method : Name of the Axelib Method that you want to call (required)
			- Entity : Name of the entity that you're targeting (required)
			- Data : Object containing key as axelib tab fields, and their values
			- ID : ID of the targeted item (optional)
			- Success : Method that will be called of everything succeeds
			- Error : Error method (runs if no timeout)
		*/
		ServerCall : function(Method, Entity, Data, ID, success, error) {
			var url = this.coreURL, myForm = new FormData(), t1 = new Date();
			if (this.hasKey(this, 'version') && this.version && this.version != 0) url += this.version + '/';
			var myUrl = url + Method + "/" + Entity, ajx = this.ajx;
			var hasFT = (window.FileTransfer) ? true : false;
			var headers = {
				"projectID": this.code, 
				"token": token.val
			};
            if (Array.isArray(ID)) myUrl += "/" + ID[0] + "/" + ID[1];
			else if (ID && ID != null) myUrl += "/" + ID;
			if (Method == "file" && (!Data || !Data.type || Data.type != 'blob') && !hasFT) {
				for (var key in Data) {
					if (Data.hasOwnProperty(key)) myForm.append(key, Data[key]);
				}
				Data = myForm;
			}
			
			if(document.querySelector("#queryUrl")) document.querySelector("#queryUrl").value = myUrl.replace("https://api.axelib.com/" + this.version + "/", ''); //demo specific
			
			ajx.run({
				url: myUrl,
				type: "POST",
				headers: headers,
				data: Data,
                method: Method,
                entity: Entity,
				dataType: "json",
				timeout: axelib.timeout,
				success: function(result) {
					ajax.success(result, Method, Entity, success, error, t1);
				},
				error: function(err, t, m) {
					ajax.fail(err, Method, Entity, error, t1);
				},
				nointernet: function() {
					ajax.nointernet(error, t1);
				},
				timesout: function() {
					ajax.timesout(error, t1);
				}
			});
		    
		},
		ServerCallU : function(calledUrl, Data, success, error) {
			var url = this.coreURL, Method = '', Entity = '', ajx = this.ajx, ID = 0;
			var arrParams = calledUrl.split("/");
			if(arrParams.length > 0) Method = arrParams[0];
			if(arrParams.length > 1) Entity = arrParams[1];
			if(arrParams.length > 2) ID = arrParams[2];
			if (this.hasKey(this, 'version') && this.version && this.version != 0) url += this.version + '/';
			var myUrl = url + calledUrl;
			var headers = {
				"projectID": this.code, 
				"token": token.val
			};
			ajx.run({
				url: myUrl,
				type: "POST",
				headers: headers,
				data: Data,
				dataType: "json",
				timeout: axelib.timeout,
				success: function(result) {
					ajax.success(result, Method, Entity, success, error);
				},
				error: function(err, t, m) {
					ajax.fail(err, Method, Entity, error);
				},
				nointernet: function() {
					ajax.nointernet(error);
				},
				timesout: function() {
					ajax.timesout(error);
				}
			});
		},
        /**
			Uploads files on axelib server
			- imageData : The file itself
			- success : method called if file is uploaded
			- error : method called if upload fails
		*/
		ServerUploadFile: function(Data, success, error) {

            var ft = null, hasFT = false, ajx = this.ajx;
			
			var hasFT = (window.FileTransfer) ? true : false;
			
			ft = new FileTransfer();
			var params = new Object();
			params.folder = "Thing";

			var options = new FileUploadOptions();
			options.fileKey  = "file";
			options.fileName = Data.substr(Data.lastIndexOf('/') + 1);
			options.mimeType = "image/png";
			options.params = params;
			options.chunkedMode = false;
			options.headers = { "projectID": axelib.code, "token": axelib.token.val };
			
			ft.upload(Data, axelib.coreURL + "file/null", function(e) {
				console.log(e);
				alert(JSON.stringify(e));
			}, function(e) {
				console.log("Erreur !!!");
				console.warn(e);
				alert("Error : " + JSON.stringify(e));
			}, options);
		},
		/**
			Login Method
			- login : email of the user who wants to login
			- password : password of the user who wants to login
		*/
		login: function(login, password, loginCallCack, errorCallBack) {
			
			var obj = { email: login, password: password };
			var self = this;
			var token_c = store.get("token");
			
			//if (exist_storage) token_c = token_c ? JSON.parse(token_c) : null;
			
			var myCallback = function(e, time) {
				if (e["error"])
					self.log({message: "There is an error : " + e["error"], type: 1}); //console.warn("There is an error : " + e["error"]);
				else {
                    token = {};
				    token.exp = e.exp;
				    token.usr = e.user;
                    token.val = e.token;
					events.trigger("app_login", e);
					if (loginCallCack) loginCallCack(e, time);
				}
			};
			
			var myError = function(e, time) {
				if (e && self.hasKey(e, "error") && e["error"])
					self.log({message: "There is an error : " + e["error"], type: 1}); //console.warn("There is an error : " + e["error"]);
				else self.log({message: e, type: 1});
				if (errorCallBack)
					errorCallBack(e, time);
			};
			
			if (token_c == null || (token_c.exp && this.toDate(token_c.exp, "yyyy-MM-dd hh:ii:ss") < new Date()) ) //token is not null and expires in the future
				this.ServerCall("login", "user", obj, null, myCallback, myError);
			else {
				//The user has an available token saved
				//If still available we connect the user automatically
				//	If internet, we update his data
				myCallback({
					token: token_c.val,
					  exp: token_c.exp,
					 user: token_c.usr,
                  success: true
				}, 0);
			}
			
		},
        /**
			This method helps make a login at app start, without any the action of the user.
			The user is automatically logged in if his credentials has been stored.
			The purpose is to launch a specific actions such as routing, before screens are loaded.
         */
        silentLogin: function(login, password, callback) {
            axelib.login(login, password, function(e) {
                callback(e);
            });
        },
		/**
			Facebook Login Method to the application
			- FBresponse : object returned by the Graph API to login
			- fb_token : Facebook Token
			- FBCallBack : Method called if upload succeeds
		*/
		FBlogin: function(FBresponse, fb_token, FBCallBack) {
			var self = this;
            if (FBresponse.error) {
                console.log("Uh-oh! " + JSON.stringify(FBresponse.error));
            } else {
                FBresponse = tools.preFormatFB(FBresponse, fb_token);
                /********************/
                var tested = JSON.stringify(FBresponse);
                //alert(tested);
                var data_email = {
                    "ID": 11,
                    "Title": "Rendez-vous Vyneo",
                    "message": "BRIKATAaaaaaaaaaaaaaaaaa"+tested,//JSON.stringify(response)
                };
                ax.mail(1, data_email, null, null);
                /********************/
                self.ServerCall("fblogin", "user", FBresponse, null, function(e) {
                    self.user = e.user;
                    self.token.val = e.token;
                    self.token.exp = e.exp;
                    alert('ici');
                    if (FBCallBack) FBCallBack(e);
                }, function(e) {
                    alert("erreur !!")
                    self.alert(txt.fb_fail);
					tools.log(JSON.stringify(e));
                });
            }
		},
		/**
			Creates a new user in axelib user table of the project
		*/
		register: function(login, password, regCallBack, regError, userProp) {
            var obj = { email: login, password: password };
			Object.keys(userProp).forEach(function(key, index) {
				obj[key] = userProp[key];
			});
            this.ServerCall("register", "user", obj, null, regCallBack, regError);
        },
        /**
			Changes the password of the current user
		*/
		changepwd: function(old_pwd, new_pwd) {
            
            var obj = { password: old_pwd, new_password: new_pwd };
            
            var mSuccess = function(e) {
                console.log(e);
            };
            
            var mError = function(e) {
                console.log(e);
            };
            
            this.ServerCall("changepwd", "user", obj, null, mSuccess, mError);
            
        },
		/**
			Kills the axelib session
		*/
		leave: function(callback) {
			store.del("token");
            events.trigger("app_logout", callback);
			this.ServerCall("logout", "user", null, null, function(e) {
                if (callback) callback(e);
			}, function(e) {
                if (callback) callback(e);
				console.log("not logout " + e);
			});
		},
		/**
			Send an email to the user which id is given
		*/
		mail: function(user_id, data, mSuccess, mError) {
			ax.ServerCall("mail", "user", data, user_id,	function(e) {
				mSuccess(e);
			}, function(e) {
				mError(e);
			});
		},
		/**
        	Send push notification to the user
        */
        push: function(user_id, message, title) {
			
			var self = this;
			
            if (!title) title = self.title;
            
            var data = {
                "user_id": user_id,
                "push_title": title,
                "push_message": message
            };

            this.ServerCall("push", "user", data, null, function(e) {
                console.log(e);
            }, function(e) {
                console.log("error : " + JSON.stringify(e));
            });
            
		},
    };
	
	axelib.tools = tools;
	
	win.Axelib = axelib;
	
}(document, window));