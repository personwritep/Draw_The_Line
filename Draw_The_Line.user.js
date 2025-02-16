// ==UserScript==
// @name        Draw The Line ⭐
// @namespace        http://tampermonkey.net/
// @version        0.7
// @description        各種の装飾線を記入するツール  ショートカット「Ctrl+F3」
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/entry/srventry*
// @exclude        https://blog.ameba.jp/ucs/entry/srventrylist.do*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameblo.jp
// @grant        none
// @updateURL        https://github.com/personwritep/Draw_The_Line/raw/main/Draw_The_Line.user.js
// @downloadURL        https://github.com/personwritep/Draw_The_Line/raw/main/Draw_The_Line.user.js
// ==/UserScript==


let retry=0;
let interval=setInterval(wait_target, 100);
function wait_target(){
    retry++;
    if(retry>10){ // リトライ制限 10回 1sec
        clearInterval(interval); }
    let target=document.getElementById('cke_1_contents'); // 監視 target
    if(target){
        clearInterval(interval);
        main(); }}


function main(){
    let editor_iframe;
    let iframe_doc;
    let selection;
    let range;
    let task=0; // アンダーライン・マーカー線・消し線・終了
    let add_padd; //「MS Pゴシック」のために padding-bottom追加フラグ

    let read_json;
    let setting; // 入力枠の設定とユーザー設定値登録

    let ua=0; // Chromeの場合のフラグ
    let agent=window.navigator.userAgent.toLowerCase();
    if(agent.indexOf('firefox') > -1){ ua=1; } // Firefoxの場合のフラグ


    read_json=localStorage.getItem('Draw_Line'); // ローカルストレージ 保存名
    setting=JSON.parse(read_json);
    if(setting==null){
        setting=[['DrawTheLine','0','0','0'],['1','1.23','#333','0'],['1','1.23','#333','0'],
                 ['0.6','0.7','#ccc','0'],['1','0.66','#333','0'],['1','0.54','#333','0']]; }
    let write_json=JSON.stringify(setting);
    localStorage.setItem('Draw_Line', write_json); // ローカルストレージ 保存


    let target=document.getElementById('cke_1_contents'); // 監視 target
    let monitor=new MutationObserver(catch_key);
    monitor.observe(target, {childList: true}); // ショートカット待受け開始

    catch_key();



    function catch_key(){
        if(document.querySelector('.cke_wysiwyg_frame') !=null){ //「通常表示」から実行開始
            editor_iframe=document.querySelector('.cke_wysiwyg_frame');
            iframe_doc=editor_iframe.contentWindow.document;
            selection=iframe_doc.getSelection();

            iframe_doc.addEventListener('keydown', check_key);
            document.addEventListener('keydown', check_key);

            function check_key(event){
                let gate=-1;
                if(event.ctrlKey==true){
                    if(event.keyCode==114){ // F3
                        event.preventDefault(); gate=1; }
                    if(gate==1){
                        event.stopImmediatePropagation();
                        do_task(); }}}

            function do_task(){
                if(task==0){
                    task=1;
                    panel_disp();
                    set_panel();
                    draw_line(); }
                else if(task==1 || task==2){
                    task=3;
                    set_panel();
                    draw_line(); }
                else if(task==3){
                    task=4;
                    set_panel();
                    draw_line(); }
                else if(task==4 || task==5){
                    task=0;
                    panel_remove(); }}
        }} // catch_key()



    function draw_line(){
        let insert_node;
        let style_text;

        let l_type=document.querySelector('#l_type');
        let single=document.querySelector('#single');
        let double=document.querySelector('#double');
        let pxem=document.querySelector('#pxem');
        let l_width=document.querySelector('#l_width');
        let l_base=document.querySelector('#l_base');
        let l_trance=document.querySelector('#l_trance');
        let l_color=document.querySelector('#l_color');
        let ms=document.querySelector('#ms');
        let exp=document.querySelector('#export');
        let imp=document.querySelector('#import');
        let file_read=document.querySelector('#file_read');


        pick_color();


        double.onclick=function(){
            double.checked=true;
            if(task==1){
                task=2;
                set_panel(); }
            if(task==4){
                task=5;
                set_panel(); }}

        single.onclick=function(){
            single.checked=true;
            if(task==2){
                task=1;
                set_panel(); }
            if(task==5){
                task=4;
                set_panel(); }}


        l_width.addEventListener('input', function(event){
            event.preventDefault();
            setting[task][0]=l_width.value;
            let write_json=JSON.stringify(setting);
            localStorage.setItem('Draw_Line', write_json); }); // ローカルストレージ 保存


        l_base.addEventListener('input', function(event){
            event.preventDefault();
            setting[task][1]=l_base.value;
            let write_json=JSON.stringify(setting);
            localStorage.setItem('Draw_Line', write_json); }); // ローカルストレージ 保存


        l_trance.addEventListener('input', function(event){
            event.preventDefault();
            if(!test_color(l_color.value) && l_color.value.length==9){ // 不適合な #付き9桁コードの場合
                if(test_color(l_color.value.slice(0, -2))){ // アルファ―値のみ不適合なら修正
                    l_color.value=l_color.value.slice(0, -2); }}
            if(!test_color(l_color.value) && l_color.value.length==8){ // 不適合な #付き8桁コードの場合
                if(test_color(l_color.value.slice(0, -1))){ // アルファ―値のみ不適合なら修正
                    l_color.value=l_color.value.slice(0, -1); }}

            if((test_color(l_color.value))){
                trance();
                l_color.style.boxShadow='inset -20px 0 ' + l_color.value; }
            else{
                l_trance.value=1; } // 変換不能なコード, カラー名などは「1」を変更できない

            setting[task][2]=l_color.value;
            let write_json=JSON.stringify(setting);
            localStorage.setItem('Draw_Line', write_json); }); // ローカルストレージ 保存


        ms.onclick=function(){
            if(add_padd==0){
                add_padd=1;
                ms.style.boxShadow='inset 0 -5px 0 0 red'; }
            else{
                add_padd=0;
                ms.style.boxShadow='none'; }

            setting[task][3]=add_padd;
            let write_json=JSON.stringify(setting);
            localStorage.setItem('Draw_Line', write_json); } // ローカルストレージ 保存


        exp.onclick=function(){
            let write_json=JSON.stringify(setting);
            let blob=new Blob([write_json], {type: 'application/json'});
            try{
                let a_elem=document.createElement('a');
                a_elem.href=URL.createObjectURL(blob);
                document.body.appendChild(a_elem);
                a_elem.download='draw_line.json'; // 保存ファイル名
                if(ua==1){
                    a_elem.target = '_blank';
                    document.body.appendChild(a_elem); }
                a_elem.click();
                if(ua==1){
                    document.body.removeChild(a_elem); }
                URL.revokeObjectURL(a_elem.href);
                alert("✅  ファイルを保存しました\n"+
                      "　　ダウンロードフォルダーを確認してください"); }
            catch(e){
                alert("❌ ファイル保存時にエラーが発生しました\n"+
                      "　　ダウンロードフォルダーを確認してください"); }}


        imp.onclick=function(){
            file_read.click(); }

        file_read.addEventListener("change" , function(event){
            event.stopImmediatePropagation();

            if(!(file_read.value)) return; // ファイルが選択されない場合
            let file_list=file_read.files;
            if(!file_list) return; // ファイルリストが選択されない場合
            let file=file_list[0];
            if(!file) return; // ファイルが無い場合

            let file_reader=new FileReader();
            file_reader.readAsText(file);
            file_reader.onload=function(){
                if(file_reader.result.slice(0, 15)=='[["DrawTheLine"'){ // ファイルデータの確認
                    setting=JSON.parse(file_reader.result); // 読出してストレージを上書き
                    let write_json=JSON.stringify(setting);
                    localStorage.setItem('Draw_Line', write_json); // ローカルストレージ 保存
                    set_panel(); // パネル設定をリセット

                    alert("✅　装飾線設定のデータを読込みました\n"+
                          "　　　読込んだファイル名:　" + file.name); }
                else{
                    alert("❌　Draw The Line の Exportファイルではありません\n"+
                          "　　　Importファイルは 「draw_line ... 」の名前です"); }}});


        l_type.onclick=function(){
            range=selection.getRangeAt(0);
            get_param();
            insert_node=document.createElement('span');
            if(add_padd==1){
                insert_node.style.paddingBottom='.4em'; }
            insert_node.style.background=style_text;

            try{
                range.surroundContents(insert_node); }
            catch(e){;}
            range.collapse(); }


        function get_param(){
            let l_w=l_width.value;
            let l_b= l_base.value;
            let l_c=l_color.value;

            if(task==1){
                style_text=
                    'linear-gradient(transparent '+ l_b +'em, '+
                    l_c +' 0, '+
                    l_c +' calc('+ l_b +'em + '+ l_w +'px), transparent 0)'; }
            if(task==2){
                style_text=
                    'linear-gradient('+
                    'transparent '+ l_b +'em, '+
                    l_c +' 0, '+ l_c +' calc('+ l_b +'em + 1px), '+
                    'transparent 0, transparent calc('+ l_b +'em + 2px), '+
                    l_c +' 0, '+ l_c +' calc('+ l_b +'em + 3px), '+
                    'transparent 0)'; }
            if(task==3){
                style_text=
                    'linear-gradient(transparent '+ l_b +'em, '+
                    l_c +' 0, '+
                    l_c +' calc('+ l_b +'em + '+ l_w +'em), transparent 0)'; }
            if(task==4){
                style_text=
                    'linear-gradient(transparent '+ l_b +'em, '+
                    l_c +' 0, '+
                    l_c +' calc('+ l_b +'em + '+ l_w +'px), transparent 0)'; }
            if(task==5){
                style_text=
                    'linear-gradient('+
                    'transparent '+ l_b +'em, '+
                    l_c +' 0, '+ l_c +' calc('+ l_b +'em + '+ l_w +'px), '+
                    'transparent 0, transparent calc('+ l_b +'em + '+ l_w +'px + 3px), '+
                    l_c +' 0, '+ l_c +' calc('+ l_b +'em + '+ 2*l_w +'px + 3px), '+
                    'transparent 0)'; }}
    } // draw_line()



    function set_panel(){
        let l_type=document.querySelector('#l_type');
        let type_1=document.querySelector('#type_1');
        let type_2=document.querySelector('#type_2');
        let single=document.querySelector('#single');
        let double=document.querySelector('#double');
        let pxem=document.querySelector('#pxem');
        let l_width=document.querySelector('#l_width');
        let l_base=document.querySelector('#l_base');
        let l_trance=document.querySelector('#l_trance');
        let l_color=document.querySelector('#l_color');
        let ms=document.querySelector('#ms');

        if(task==1){
            single.checked=true;

            l_type.value="アンダーライン";
            type_1.style.display='inline-block';
            type_2.style.display='none';
            pxem.classList.remove('wpxd');
            pxem.classList.add('wpx');

            l_width.disabled=false;
            l_width.value=setting[1][0];
            l_base.value=setting[1][1];
            l_color.value=setting[1][2];
            add_padd=setting[1][3];

            l_width.setAttribute('min', '1');
            l_width.setAttribute('max', '50');
            l_width.setAttribute('step', '1');
            l_base.setAttribute('min', '0.9');
            l_base.setAttribute('max', '1.5');
            l_base.setAttribute('step', '0.01'); }

        else if(task==2){
            pxem.classList.remove('wpx');
            pxem.classList.add('wpxd');

            l_width.disabled=true;
            l_width.value=1; // 固定値
            l_base.value=setting[2][1];
            l_color.value=setting[2][2];
            add_padd=setting[2][3]; }

        else if(task==3){
            l_type.value="マーカー線";
            type_1.style.display='none';
            type_2.style.display='inline-block';
            l_width.classList.add('m');
            l_base.classList.add('m');
            pxem.classList.remove('wpx');
            pxem.classList.add('wem');

            l_width.disabled=false;
            l_width.value=setting[3][0];
            l_base.value=setting[3][1];
            l_color.value=setting[3][2];
            add_padd=setting[3][3];
            l_trance.value='1'; // 初期値

            l_width.setAttribute('min', '0.1');
            l_width.setAttribute('max', '1.5');
            l_width.setAttribute('step', '0.1');
            l_base.setAttribute('min', '0');
            l_base.setAttribute('max', '1.3');
            l_base.setAttribute('step', '0.1');
            l_trance.setAttribute('min', '0.1');
            l_trance.setAttribute('max', '1');
            l_trance.setAttribute('step', '0.1'); }

        else if(task==4){
            single.checked=true;

            l_type.value="取り消し線";
            type_1.style.display='inline-block';
            type_2.style.display='none';
            l_width.classList.remove('m');
            l_base.classList.remove('m');
            pxem.classList.remove('wem');
            pxem.classList.add('wpx');

            l_width.value=setting[4][0];
            l_base.value=setting[4][1];
            l_color.value=setting[4][2];

            l_width.setAttribute('min', '1');
            l_width.setAttribute('max', '20');
            l_width.setAttribute('step', '1');
            l_base.setAttribute('min', '0');
            l_base.setAttribute('max', '1');
            l_base.setAttribute('step', '0.01');
            add_padd=0; // 固定値
            ms.style.display='none'; }

        else if(task==5){
            l_width.value=setting[5][0];
            l_base.value=setting[5][1];
            l_color.value=setting[5][2]; }

        show_color();
        if(add_padd==1){
            ms.style.boxShadow='inset 0 -5px 0 0 red'; }
        else{
            ms.style.boxShadow='none'; }} // set_panel()



    function panel_disp(){
        let panel=document.createElement('div');
        panel.setAttribute('id', 'l_panel');

        panel.innerHTML=
            '<input id="l_type" type="submit">'+
            '<div id="type_wrap">'+
            '<div id="type_1">'+
            '<input id="single" type="radio" name="s_d"><span class="l_label">単線</span>'+
            '<input id="double" type="radio" name="s_d"><span class="l_label">2重線</span>'+
            '</div>'+
            '<span class="l_label label_w">線幅</span>'+
            '<div id="pxem" class="wpx"><input id="l_width" type="number"></div>'+
            '<span class="l_label">開始位置</span>'+
            '<div class="wem"><input id="l_base" type="number"></div>'+
            '<div id="type_2">'+
            '<span class="l_label">透過度</span>'+
            '<div class="wtr"><input id="l_trance" type="number"></div>'+
            '</div>'+
            '</div>'+
            '<span class="l_label">線色</span>'+
            '<input id="l_color" type="text" autocomplete="off">'+
            '<input id="ms" type="submit" value="MS">'+
            '<input id="export" type="submit" value="Export">'+
            '<input id="import" type="submit" value="Import">'+
            '<input id="file_read" type="file">'+
            '<div id="test"></div>';

        let css=
            '#l_panel { position: fixed; top: 15px; left: calc(50% - 490px); width: 792px; '+
            'padding: 6px 0 6px 15px; font-size: 14px; border: 1px solid #ccc; '+
            'border-radius: 4px; background: #eff5f6; z-index: 10; }'+
            '#type_wrap { display: inline-block; text-align: right; width: 355px; }'+
            '#type_1 { display: inline-block; } #type_2 { display: none; }'+
            '#l_panel input { position: relative; margin-right: 10px; padding-top: 2px; }'+
            '#l_panel input:hover { z-index: 1; }'+
            '#l_panel input[type="radio"] { margin: 0 2px 0 8px; vertical-align: -2px; box-shadow: none; }'+
            '.l_label { margin: 0 4px 0 0; } .label_w { margin: 0 4px 0 10px; }'+
            '#l_type { width: 110px; margin-right: 4px !important; }'+
            '.wpx, .wpxd, .wem, .wtr { position: relative; display: inline-block; }'+
            '.wpx::after { content: "px"; position: absolute; right: 15px; top: 5px; '+
            'padding: 0 1px; background: #fff; }'+
            '.wpxd::after { content: "px"; position: absolute; right: 15px; top: 5px; }'+
            '.wem::after { content: "em"; position: absolute; right: 15px; top: 5px; background: #fff; }'+
            '#l_width { width: 38px; text-align: center; padding: 2px 4px 0 0; }'+
            '#l_width[disabled]:hover { z-index: 0; }'+
            '#l_width.m { width: 45px; text-align: left; padding: 2px 4px 0 5px; }'+
            '#l_base { width: 54px; padding: 2px 4px 0 3px; }'+
            '#l_base.m { width: 45px; padding: 2px 4px 0 5px; }'+
            '#l_trance { width: 40px; text-align: center; padding: 2px 0 0 4px; }'+
            '#l_color { width: 85px; padding: 2px 24px 0 6px; border: thin solid #aaa; height: 23px; }'+
            '#ms { margin-left: 5px; }'+
            '#export, #import { position: absolute !important; padding: 2px 1px 0; }'+
            '#export { right: 58px; } #import { right: 2px; } #file_read { display: none; }'+
            '#test { display: inline-block; }'+
            '#cke_42 { top: 60px !important; left: calc( 50% - 45px) !important; }';

        if(ua==1){
            css=css +
                '#l_panel input[type="radio"] { vertical-align: 0; }'+
                '#l_panel input[type="number"] { height: 23px; }'+
                '#l_width, #l_base, #l_trance, #l_color { height: 24px; border: thin solid #aaa; }'+
                '.wtr::after { content: "　"; position: absolute; right: 12px; top: 5px; '+
                'background: #fff; width: 1.2em; }'+
                '.wpxd::after { background: #e3e3e3; }'+
                '#export, #import { top: 7px; }'+
                '#ms { padding: 0 1px; height: 27px; border: 1px solid #aaa; }'; }

        let style=document.createElement('style');
        style.innerHTML=css;
        panel.appendChild(style);

        let l_panel=document.querySelector('#l_panel');
        if(!l_panel){
            document.querySelector('.l-body').appendChild(panel); }} // panel_disp()



    function panel_remove(){
        let l_panel=document.querySelector('#l_panel');
        l_panel.remove(); }



    function test_color(color){
        return color.match(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/)!==null; }



    function test_colorE(color){ // test_colorE ⏹
        let test=document.querySelector('#test');
        test.style.color='#000001';
        if(color!=''){
            test.style.color=color; } // 引数の入力がない場合

        let colorR=window.getComputedStyle(test).color;
        if(colorR){
            if(colorR!='rgb(0, 0, 1)'){
                return true; }
            else{
                if(color=='rgb(0, 0, 1)' || color=='#000001' || color=='#000001ff'){
                    return true; }
                else{
                    return false; }}}
        else{
            return false; }}



    function show_color(){
        let l_color=document.querySelector('#l_color');
        l_color.style.boxShadow='inset -20px 0 ' + l_color.value; }



    function pick_color(){
        let set_color;
        let color_input_selector;
        let color_label;
        let icon_button;

        editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        iframe_doc=editor_iframe.contentWindow.document;
        selection=iframe_doc.getSelection();

        if(ua==0){
            color_label=document.querySelector('#cke_16_label');
            icon_button=document.querySelector('#cke_17'); }
        else if(ua==1){
            color_label=document.querySelector('#cke_15_label');
            icon_button=document.querySelector('#cke_16'); }

        let target_p=color_label; // 監視 アイコンのカラーラベル
        let monitor_p=new MutationObserver( get_copy );

        let l_color=document.querySelector('#l_color');


        l_color.onclick=function(event){
            if(event.ctrlKey==true){
                event.preventDefault();
                icon_button.click();
                selection.removeAllRanges(); // 反転選択がある場合に背景指定を防止する
                monitor_p.observe(target_p, {attributes: true}); }} // アイコンカラー取得開始

        l_color.addEventListener('input', function(event){
            event.preventDefault();
            let l_trance=document.querySelector('#l_trance');
            if(l_trance){
                l_trance.value=1; } // 透過度をリセットする

            if(test_colorE(l_color.value)){ // test_colorEを実行 ⏹
                l_color.style.boxShadow='inset -20px 0 ' + l_color.value; }
            else{
                if(l_color.value==''){
                    l_color.style.boxShadow='inset 0 0 0 1px black'; }
                else{
                    l_color.style.boxShadow='inset 0 0 0 1px black'; // 担保コード
                    l_color.style.boxShadow=
                        'inset 0 0 0 1px black, inset -20px 0 ' + l_color.value; }}

            if(test_colorE(l_color.value)){ // test_colorEを実行 ⏹ 不適正な入力は登録されない
                setting[task][2]=l_color.value;
                let write_json=JSON.stringify(setting);
                localStorage.setItem('Draw_Line', write_json); }}); // ローカルストレージ 保存


        document.addEventListener('mousedown', function(){
            monitor_p.disconnect(); }); // アイコンカラー取得終了

        if(document.querySelector('.cke_wysiwyg_frame') !=null){
            let editor_iframe=document.querySelector('.cke_wysiwyg_frame');
            let iframe_doc=editor_iframe.contentWindow.document;
            iframe_doc.addEventListener('mousedown', function(){
                monitor_p.disconnect(); }); } // アイコンカラー取得終了


        function get_copy(){
            let l_trance=document.querySelector('#l_trance');
            if(l_trance){
                l_trance.value=1; } // 透過度をリセットする
            set_color=color_label.getAttribute('data-color');
            l_color.value='#'+ set_color;
            l_color.style.boxShadow=
                'inset -20px 0 ' + l_color.value;
            monitor_p.disconnect(); // アイコンカラー取得終了

            setting[task][2]=l_color.value;
            let write_json=JSON.stringify(setting);
            localStorage.setItem('Draw_Line', write_json); } // ローカルストレージ 保存


        let target_body=document.querySelector('.l-body'); // 監視 target
        let monitor_generator=new MutationObserver(stealth);
        monitor_generator.observe(target_body, {childList: true, subtree: true});

        function stealth(){
            let color_generator=document.querySelector('.ck-l-colorGenerator');
            if(color_generator){
                color_generator.addEventListener('mousedown', function(event){
                    event.stopImmediatePropagation(); }); }}
    } // pick_color()



    function trance(){
        let l_color_code;
        let l_color=document.querySelector('#l_color');
        let l_trance=document.querySelector('#l_trance');

        if(l_trance.value){
            if(test_color(l_color.value)){ // #カラーコードは全て#+16進8桁に変更
                if(l_color.value.length==4){
                    let ch=l_color.value.split("");
                    l_color_code='#'+ch[1]+ch[1]+ch[2]+ch[2]+ch[3]+ch[3]+'90'; }
                if(l_color.value.length==5){
                    let ch=l_color.value.split("");
                    l_color_code='#'+ch[1]+ch[1]+ch[2]+ch[2]+ch[3]+ch[3]+ch[4]+ch[4]; }
                if(l_color.value.length==7){
                    l_color_code=l_color.value+'90'; }
                if(l_color.value.length==9){
                    l_color_code=l_color.value; }

                if(l_trance.value!=1){
                    let ch=l_color_code.split('');
                    if(ch[7].match(/[A-Fa-f]/)){ // アルファ値の初桁が「9」を超える場合は「9」に
                        ch[7]='9'; }
                    if(Number(ch[7])<10*l_trance.value-1){ // 初桁とl_tranceの差が「2」以上は手入力
                        l_trance.value=Number(ch[7])/10; } // この場合はl_trance値を入力値に合わせる
                    else{
                        ch[7]=10*l_trance.value.toString(); } // l_tranceの入力に合わせて増減操作
                    ch[8]='0';
                    l_color.value=ch.join(''); }

                else if(l_trance.value==1){
                    l_color.value=l_color_code.slice(0, -2); }
            }}}

} // main()

