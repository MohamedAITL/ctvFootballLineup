<?php 
// Initialize the session
session_start();
 
// Check if the user is already logged in, if yes then redirect him to welcome page
/*if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true){*/
	
require_once('config.php');
if(isset($_GET['team'])){
  $team= $_GET['team'];
  $team2= $_GET['team2'];
}  

if(empty($team)){
  $team= 'wac-';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<style>
        .imgs {
    width: 3.5vw;
    height: 3.5vw;
    overflow: hidden;
    border-radius: 50%;
    margin: 0 auto;
    background: url(../images/bgimg.jpg);
}
.names {
    /* position: absolute; */
    right: 18%;
    bottom: 1vw;
    color: #7e1333;
    font-size: 1.2vw;
    font-weight: 700;
    background: rgb(255 255 255);
    padding: 10px 27px;
    border-radius: 4px;
    z-index: 4;
    text-align: center;
}
section ul {
    padding: 0px 0 10px;
    margin: 0px;
    width: 100%;
    clear: left;
    background: #ffffff;
    border-radius: 10px 0px 0px 10px;
    margin-bottom: 10px;
}
.name span {
    color: #665b94;
    /* color: #09218d; */
}
.name {
    color: #f4791f;
    background: rgb(255 255 255);

}
.match {
    width: 57.5vw;
    /* width: 75vw; */
    position: relative;
    left: 56%;
    top: 12vh;
    transform: translateX(-50%);
    margin: 0;
    border: 2px solid #fff4f8;
    border-radius: 10px;
    overflow: hidden;
}
.match img {
    display: block;
}
.foot {
    position: absolute;
    left: 50%;
    width: 2vw;
    transform: translate(-50%,-50%);
    top: 51%;
}

section {
    width: 23%;
    top: 12%;
    left: 1vw;
    position: absolute;
    background: #ffffff5e;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 5px 4px #0000004d;
    border: 1px solid #1c1c1c80;
    text-align: right;
}
.imgs {
    width: 2.4vw;
    height: 2.4vw;
    box-shadow: 0px 0px 0px 2px white;
    box-sizing: border-box;
}
/*section {
    width: 24%;
    top: 2%;
    left: 1vw;
    position: absolute;
    background: #ffffff5e;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 5px 4px #0000004d;
    border: 1px solid #1c1c1c80;
    text-align: right;
}*/
.morocco {
    width: 7vw;
    height: 7vw;
    padding: 15px;
    padding-right: 15px;
    background: #fff;
    border-radius: 11px;
    text-align: center;
}
.morocco a img {
    width: 75%;
    border-radius: unset;
    overflow: auto;
    box-shadow: unset;
}
/*.logos .rad {
    width: 7vw;
    height: 7vw;
    margin-right: 1vw;
}
.clubs {
    padding-left: 2vw;
}*/
li {
    background: #1f8c66!important;
}


.logos .rad {
    display: inline-block;
    width: 8vw;
    height: 8vw;
    margin-bottom: 5vh;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 2px 2px 2px #0000005c;
}
section {
    width: 23%;
    top: 4%;
    left: 1vw;
    position: absolute;
    background: #ffffff5e;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 5px 4px #0000004d;
    border: 1px solid #1c1c1c80;
    text-align: right;
}
body {  
    background: url('bgimg.png') no-repeat center center fixed;
    background-size: cover;
    /* overflow-x: hidden; */
}
</style>
<body>
 <a href="welcome.php?team=<?php echo $team;?>"><img src="images/logo.png" alt="" class="logo no" style="display:none;"></a>
  <!-- <img src="images/coaches/<?php echo $team; ?>.png" alt="" class="coach no">
    <?php

        $sql = "SELECT * FROM player WHERE  team='$team' and position LIKE  '%coach%'";
        $result = $link->query($sql);

        if ($result->num_rows > 0) {
          while($row = $result->fetch_assoc()) {
            
              ?>
                <div class="name no"><?php echo '<span>المدرب : </span>'.$row["name"]; ?></div>
              <?php
            }

          }
        ?>-->
    
<div class="match" style="left:50%;">
    <img src="images/field.png" alt=""><div class="draggable foot">
      <img src="images/foot.png" alt="">
    </div>
</div>
<section class="no" style="width:17%;">
  <h1>
 <?php

        $sql = "SELECT * FROM team WHERE  name='$team'";
        $result = $link->query($sql);

        if ($result->num_rows > 0) {
          while($row = $result->fetch_assoc()) {
            
             echo ' قائمة نادي '.$row["namear"];
            }

          }
        ?>
  </h1>
  <div class="positions menu clearfix">
    <ul class="clearfix">
      
        <?php

        $sql = "SELECT * FROM player WHERE  team='$team' ";
        $result = $link->query($sql);

        if ($result->num_rows > 0) {
          // output data of each row
          while($row = $result->fetch_assoc()) {
            
              ?>
            <li class="goal">
              <div class="draggable" id="drag-1">
                <div class="imgs"><img src="<?php 
                if(empty($row["image"])){
                    echo 'images/'.$team.'.jpg';
                }else{
                 echo $row["image"];   
                }

                
                ?>"/></div>
                <p><?php echo $row["name"]; ?></p>
              </div>
            </li>
              <?php
            }

          }
        ?>
        
    </ul>
  </div>
</section>


<section class="no" style="width:17%;left:81%;<?php 

if(!isset($_GET['team2'])){
echo 'display:none;';
}  
 ?>>" 
  ><h1>
 <?php

        $sql = "SELECT * FROM team WHERE  name='$team2'";
        $result = $link->query($sql);

        if ($result->num_rows > 0) {
          while($row = $result->fetch_assoc()) {
            
             echo ' قائمة نادي '.$row["namear"];
            }

          }
        ?>
  </h1>
  <div class="positions menu clearfix">
    <ul class="clearfix">
      
        <?php

        $sql = "SELECT * FROM player WHERE  team='$team2' ";
        $result = $link->query($sql);

        if ($result->num_rows > 0) {
          // output data of each row
          while($row = $result->fetch_assoc()) {
            
              ?>
            <li class="goal">
              <div class="draggable" id="drag-1">
                <div class="imgs"><img src="<?php 
                if(empty($row["image"])){
                    echo 'images/'.$team.'.jpg';
                }else{
                 echo $row["image"];   
                }

                
                ?>"/></div>
                <p><?php echo $row["name"]; ?></p>
              </div>
            </li>
              <?php
            }

          }
        ?>
        
    </ul>
  </div>
</section>

<?php 
require_once('logos.php');  
?>

</body>
<script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
<script
  src="https://code.jquery.com/jquery-1.12.4.min.js"
  integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ="
  crossorigin="anonymous"></script>
<script type="text/javascript" src="js/script.js"></script>
</html>
<?php 
/*}*/
?>