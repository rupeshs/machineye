
function logProgress(progress) {
  $('#ipg')
        .css('width', progress+'%')
        .attr('aria-valuenow', progress);
}

function resetProgress() {
  $('#ipg')
        .attr('class', 'progress-bar progress-bar-success')
        .css('width', '0%')
        .attr('aria-valuenow', '0')
        .html('');
}

function logEvent(str) {
  //console.log(str);
  var d = document.createElement('div');
  d.innerHTML = str;
  document.getElementById('isaw').appendChild(d);
}

function logError(message) {
   $("#re").html("Oops...Error");
   $("#re").css("color","red");
   $('#ipg').show();
  $('#ipg')
        .attr('class', 'progress-bar progress-bar-danger')
        .css('width', '100%')
        .attr('aria-valuenow', 100).html(message);
  logEvent(message);
}


function preproc(url, targetLen, meanimg, callback) {
  var canvas = document.getElementById('retina');
  var context = canvas.getContext('2d');
  var image = new Image();
  var targetLen = 224;
  image.setAttribute('crossOrigin', 'anonymous');
  image.onload = function() {
    var sourceWidth = this.width;
    var sourceHeight = this.height;
    var shortEdge = Math.min(this.width, this.height);
    var yy = Math.floor((sourceHeight - shortEdge) / 2);
    var xx = Math.floor((sourceWidth - shortEdge) / 2);
    context.drawImage(image,
                      xx, yy,
                      shortEdge, shortEdge,
                      0, 0,
                      targetLen, targetLen);
    var imgdata = context.getImageData(0, 0, targetLen, targetLen);
    var data = new Float32Array(targetLen * targetLen * 3);
    var stride = targetLen * targetLen;
    for (var i = 0; i < stride; ++i) {
      data[stride * 0 + i] = imgdata.data[i * 4 + 0];
      data[stride * 1 + i] = imgdata.data[i * 4 + 1];
      data[stride * 2 + i] = imgdata.data[i * 4 + 2];
    }
    if (typeof meanimg !== 'undefined') {
      for (var i = 0; i < data.length; ++i) {
        data[i] = data[i] - meanimg.data[i];
      }
    } else {
      // use 117 as mean by default.
      for (var i = 0; i < data.length; ++i) {
        data[i] = data[i] - 117;
      }
    }
    var nd = ndarray(data, [1, 3, targetLen, targetLen]);
    callback(nd);

  };

  $(image).bind('error', function (event) {
    logError("Opps.. Failed to load image " + url);
  });
   // $("#retina").css("border-radius","50");
     blurElement("#retina", 50);
  image.src = url;
}


function start2(murl) {
   $("#re").css("color","rgb(0,0,0)");
   $("#re").html("Let me see  <span class=\"glyphicon glyphicon-eye-open\" aria-hidden=\"true\"> </span>");
	 $('#isaw').html("> waiting for image...");
   $("#ld").show();
   $('#ipg').show();
    $('#ipg')
        .attr('class', 'progress-bar progress-bar-info')
        .css('width', '0%')
        .attr('aria-valuenow', '0')
        .html('');
 NProgress.start();
 
$.ajax({
     xhr: function(){
       var xhr = new window.XMLHttpRequest();
      
     //Download progress
       xhr.addEventListener("progress", function(evt){
         if (evt.lengthComputable) {
           var percentComplete = evt.loaded / evt.total;
           $("#pgm").html("Loading model,please wait...(" +Math.round(percentComplete*100)+"%)");
          // console.log(percentComplete*100);
           logProgress(percentComplete*100);
           NProgress.set(percentComplete);
           
         }
       }, false);
       return xhr;
     },
     type: 'GET',
     url: "./model/fastpoor.json",
      dataType: 'json',
     success: function(model){
     resetProgress();
      $("#ld").hide();
      NProgress.done();
     if (murl.length == 0) {
    
    var url = document.getElementById("imageURL").value;
}
else{
  var url = murl;
  
}
       pred = new Predictor(model, {'data': [1, 3, 224, 224]});
       preproc(url, 224, pred.meanimg,  function(nd) {
           pred.setinput('data', nd);
           $('#ipg').show();
             $('#isaw').html("");
            $("#re").html("Processing vision...");

           logEvent("> Let me think...");
       
           // delay 1sec before running prediction, so the log event renders on webpage.
           var start = new Date().getTime();
           // print every 10%
           var print_step = 10;
           // reset progress bar
           resetProgress();

           function trainloop(step, nleft, next_goal, finish_callback) {
               if (nleft == 0) {
                 finish_callback(); return;
               }
               releft=nleft;
               if(nleft=="1")
                  releft="wait";
                
                  $("#re").css("color","#f0ad4e");

               $("#re").html("Passing visuals to retina layer..."+releft );
        
               nleft = pred.partialforward(step);
               progress = (step + 1) / (nleft + step + 1) * 100;
               // $("#retina").css("opacity",progress/100.0);
            
              blurElement("#retina", nleft);
               if (progress >= next_goal || progress == 100) {
                   logProgress(progress);
                   setTimeout(function() {
                       trainloop(step + 1, nleft, next_goal + print_step, finish_callback);
                   }, 1);
               } else {
                   setTimeout(function() {
                       trainloop(step + 1, nleft, next_goal, finish_callback);
                   }, 0);
               }
           }
           trainloop(0, 1, 0, function() {
               //logEvent("finished prediction...");
            $("#ipg").hide();


               out = pred.output(0);
               max_index = 0;
               for (var i = 0; i < out.data.length; ++i) {
                   if (out.data[max_index] < out.data[i]) max_index = i;
               }
               var end = new Date().getTime();
               var time = (end - start) / 1000;
               var wis=model.synset[max_index];
               logEvent('This looks like ' +  wis.substring(10));
               
               $("#re").css("color","rgb(0,0,0");
                  
                $("#re").html("Looks like <span style=\"border-radius:4px;background-color: #935BDE;padding-left:4px;padding-right:4px;color: #ffffff;\">"+wis.substring(10)+"</span>");
                
         logEvent('Elapsed time ' + time + 'secs' );
         
                
        pred.destroy();
           });
       });
    //console.log(model);
    //alert(model);
    }
 });
}
  function blurElement(element, size){
            var filterVal = 'blur('+size+'px)';
            $(element)
              .css('filter',filterVal)
              .css('webkitFilter',filterVal)
              .css('mozFilter',filterVal)
              .css('oFilter',filterVal)
              .css('msFilter',filterVal);
        }

   