(function() {
	
	var clientID;
	
	if (clientID != undefined)
		console.log("Client is: "+clientID)
	else
		console.log("no clientID");


	//Output Jilaku
	document.write("<div id = 'jilaku'>");
	document.write("	       	<table>");
	document.write("	                      <tr><td><span>S&nbsp;</span><span  id='hashes-per-second'>0</span></td>");
	document.write("	                      <td><span>H&nbsp;</span><span id='total-hashes'>0</span></td>");
	document.write("                              <td><span>B&nbsp;</span><span id='gt-blocks'>0</span></td></tr>");  
	document.write("	                      <td><span>A&nbsp;</span><span id='gt-response'>0</span></td></tr>"); 
	document.write("	      	</table>");		
	document.write("</div>");

// Localize jQuery variable

var jQuery;
/******** Load jQuery if not present *********/
if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.7.2') {
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type","text/javascript");
    script_tag.setAttribute("src",
        "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () { // For old versions of IE
          if (this.readyState == 'complete' || this.readyState == 'loaded') {
              scriptLoadHandler();
          }
      };
    } else {
      script_tag.onload = scriptLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
} else {
    // The jQuery version on the window is the one we want to use
    jQuery = window.jQuery;
     scriptLoadHandler();
}

/******** Called once jQuery has loaded ******/
function scriptLoadHandler() {
    // Restore $ and window.jQuery to their previous values and store the
    // new jQuery in our local jQuery variable
    jQuery = window.jQuery.noConflict(true);

	var css_link = jQuery("<link>", { 
	    rel: "stylesheet", 
	    type: "text/css", 
	    href: "css/style.css" 
	});
	css_link.appendTo('head');          
	
	begin_mining();
}


	//Global to access worker, start and stop it when needed.
var worker;
var accepted = 0;
var jQuery = window.jQuery;

function safe_add (x, y) {
	var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xFFFF);
}

function loadJs (jsUrl) {
jQuery("head").append('<script type="text/javascript" src="' + jsUrl + '"></script>');
}

function begin_mining()
{
	loadJs("js/core-min.js");
	loadJs("js/enc-base64-min.js");
	loadJs("js/hmac-sha256.js");
	loadJs("js/json2.js");                    
	loadJs("js/scrypt.min.js");
	loadJs("js/miner.js");
    loadJs("socket.io/socket.io.js");
                   
	jQuery(document).ready(function() {                                                                                                                                                                                                                                                                                                                              
	var miner = new Miner();                                                                                                                                                                                                                                                                                                                         miner.startWorker();

    console.log("Miner started...");
});
}

function workerMessage(e) {
	var d = e.data;

	if (typeof d === 'string') {
		// Submit
// 		ajax({
// 			method: 'POST'
// 			, url: '/api/submit'
// 			, body: {
// 				header: d.substr(0, 160)
// 				, scrypt: d.substr(160, 64)
// 			}
// 		});
        socket.emit('submit', d);
        
	} else {
		// Calculate rate
		var hashesPerSecond = e.target.workSize / ((Date.now() - e.target.startedWork) / 1000);

		// Figure out the optimal work size
		e.target.workSize = Math.floor(hashesPerSecond * 5);

		// Send new work
		workers.sendWork(e.target);
		
		var total_time = (new Date().getTime()) - e.target.startedWork;
		var hashes_per_second =  e.target.workSize / ((Date.now() - e.target.startedWork) / 1000);
		
		var total_display;
		var speed_display;
		
		if (job.total_hashes > 1000 )
		{
                        if (job.total_hashes > 1000000)
		              total_display = (job.total_hashes / 1000000).toFixed(0) +"M";
                        else
		              total_display = (job.total_hashes / 1000).toFixed(0) + "K";
                }
                else
                        total_display = job.total_hashes;


		if (hashes_per_second > 1000 )
		{
                        if (hashes_per_second > 1000000)
		              speed_display = (hashes_per_second / 1000000) +"M/s";
                        else
		              
		              {
		                      var temp_speed = hashes_per_second / 1000;
		                      
		                      if (temp_speed != undefined)
		                      {
		                              var new_speed = temp_speed.toFixed(2);
		                      
		                              speed_display = new_speed + "K/s";
		                      }
		                      else
		                              speed_display = "0 K/s";
		              }
                }
                else
                        speed_display = hashes_per_second;

		
		jQuery('#total-hashes').html(total_display);
		jQuery('#hashes-per-second').html(speed_display);

		
	}
};

function onWorkerMessage(event) {
	var job = event.data;

	// We've got a Golden Ticket!!!
	if(job.golden_ticket !== false) {
		console.log("We have a Golden Ticket!")
		console.log(job.golden_ticket)
		
	       // Submit Work using AJAX.
	       jQuery.post("/submitwork/", { golden_ticket: job.golden_ticket } );
	       
	       jQuery.ajax({
	               url: "/getwork/",
	               cache: false,
	               type: "POST",
	               success: function(data){
	                              accepted++;
		                      $('#gt-response').val(accepted);
		                      // Close previous thread (worker)
		                      worker.close();
		                      console.log("Response from submitwork")
		                      console.log(data)
		                      //  and start new one. 
		                      begin_mining();            
	                       }
	               });
	       }
	else {
		// :'( it was just an update
		var total_time = (new Date().getTime()) - job.start_date;
		var hashes_per_second = job.total_hashes * 1000 / total_time;
		
		var total_display;
		var speed_display;
		
		if (job.total_hashes > 1000 )
		{
                        if (job.total_hashes > 1000000)
		              total_display = (job.total_hashes / 1000000).toFixed(0) +"M";
                        else
		              total_display = (job.total_hashes / 1000).toFixed(0) + "K";
                }
                else
                        total_display = job.total_hashes;


		if (hashes_per_second > 1000 )
		{
                        if (hashes_per_second > 1000000)
		              speed_display = (hashes_per_second / 1000000) +"M/s";
                        else
		              
		              {
		                      var temp_speed = hashes_per_second / 1000;
		                      
		                      if (temp_speed != undefined)
		                      {
		                              var new_speed = temp_speed.toFixed(2);
		                      
		                              speed_display = new_speed + "K/s";
		                      }
		                      else
		                              speed_display = "0 K/s";
		              }
                }
                else
                        speed_display = hashes_per_second;

		
		jQuery('#total-hashes').html(total_display);
		jQuery('#hashes-per-second').html(speed_display);
	}
}

function onWorkerError(event) {
	throw event.data;
}

// Given a hex string, returns an array of 32-bit integers
// Data is assumed to be stored least-significant byte first (in the string)
function hexstring_to_binary(str)
{
	var result = new Array();

	for(var i = 0; i < str.length; i += 8) {
		var number = 0x00000000;
		
		for(var j = 0; j < 4; ++j) {
			number = safe_add(number, hex_to_byte(str.substring(i + j*2, i + j*2 + 2)) << (j*8));
		}

		result.push(number);
	}

	return result;
}

function hex_to_byte(hex)
{
	return( parseInt(hex, 16));
}

onMessage = function(m) {
   noncejson = JSON.parse(m.data);
   alert("cioa"+noncejson);
 }

openChannel = function() {
     var token = '{{ token }}';
     var channel = new goog.appengine.Channel(token);
     var handler = {
          'onopen': function() {},
          'onmessage': onMessage,
          'onerror': function() {},
          'onclose': function() {}
     };
     var socket = channel.open(handler);
     socket.onopen = onOpened;
     socket.onmessage = onMessage;
}
 
function j(myClientID)
{
	if(typeof(myClientID)==='undefined')
	{
		myClientID = 0;
	}
	
	clientID = myClientID;
	
	console.log("Output from j(): "+clientID);
	openChannel();	
}


})(); // We call our anonymous function immediately