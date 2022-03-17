<?php

function scan($path){
    return array_diff(scandir($path),['.', '..']);
}

$root = "./fonts/";

$css = "./flat-font.css";
$fl = fopen($css, "w+");

$folders = scan($root);
$files = [];
$name = "";
$content = "";

foreach ($folders as $folder){
    $files = scan($root.$folder);
    foreach ($files as $file){
        if(preg_match("/-Regular\.[a-z]+$/", $file)){
            $name = preg_replace("/(.+?)-Regular\.[a-z]+/", "$1", $file);
        }else{
            $name = preg_replace("/(.+?)\.[a-z]+/", "$1", $file);
        }
        $content .= "@font-face{
 font-family: '".$name."';
 src: url('".$root.$folder.'/'.$file."');
 font-weight: normal;
 font-style: normal;
}\n";
    }
}

fputs($fl, $content);

fclose($fl);