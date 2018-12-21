/**
 * xunshi_panolens.js
 * @author 唐玥璨
 * @namespace XUNSHI
 */

var XUNSHI = {VERSION:'0.1'};
/**
 * 信息点的初始化
 * @property {object} html - 图标的html对象，可以是任何的html标签，通过js元素写法得到的html如getElementbyID这种，同时所有的html元素必须是绝对定位
 * @property {String} position - 图标的位置，这个位置是一个坐标格式为json，例：{x:165.161,y:15.16156,z:4565.156}
 */
XUNSHI.InfoSpot = function(html,position)
{
    var point = new THREE.Vector3(position.x,position.y,position.z);
    this.htmlelement = html;
    this.position = point;
    return this;
}
/**
 * 全景图的初始化
 * @property {String} id - 全局图的id，必须全局唯一的大小
 * @property {String} img - 图片的路径
 */
XUNSHI.Panolen = function(id,img)
{
    this.img = img;
    this.id = id;
    return this;
}
/**
 * 陀螺仪控制器的初始化
 * @property {object} camera - 相机的对象
 * @property {object} domElement - 原生js的html对象
 */
XUNSHI.DeviceOrientationControls = function( camera, domElement ) {
	var scope = this;
	var changeEvent = { type: 'change' };
	var rotY = 0;
	var rotX = 0;
	var tempX = 0;
	var tempY = 0;
	this.camera = camera;
	this.camera.rotation.reorder( "YXZ" );
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.enabled = true;
	this.deviceOrientation = {};
	this.screenOrientation = 0;
	this.alpha = 0;
	this.alphaOffsetAngle = 0;
	//绑定陀螺仪数据变动事件
	var onDeviceOrientationChangeEvent = function( event ) {
		scope.deviceOrientation = event;
	};
	//绑定屏幕空间变动事件
	var onScreenOrientationChangeEvent = function() {
		scope.screenOrientation = window.orientation || 0;
	};
	//陀螺仪操作同时支持触控，触控开始绑定
	var onTouchStartEvent = function (event) {
		event.preventDefault();
		event.stopPropagation();
		tempX = event.touches[ 0 ].pageX;
		tempY = event.touches[ 0 ].pageY;

	};
	//触控移动绑定
	var onTouchMoveEvent = function (event) {
		event.preventDefault();
		event.stopPropagation();
		rotY += THREE.Math.degToRad( ( event.touches[ 0 ].pageX - tempX ) / 4 );
		rotX += THREE.Math.degToRad( ( tempY - event.touches[ 0 ].pageY ) / 4 );
		scope.updateAlphaOffsetAngle( rotY );
		tempX = event.touches[ 0 ].pageX;
		tempY = event.touches[ 0 ].pageY;

	};
	//设置相机的旋转坐标，这个就是欧拉角
	var setCameraQuaternion = function( quaternion, alpha, beta, gamma, orient ) {
		var zee = new THREE.Vector3( 0, 0, 1 );
		var euler = new THREE.Euler();
		var q0 = new THREE.Quaternion();
		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis
		var vectorFingerY;
		var fingerQY = new THREE.Quaternion();
		var fingerQX = new THREE.Quaternion();
		if ( scope.screenOrientation == 0 ) {
			vectorFingerY = new THREE.Vector3( 1, 0, 0 );
			fingerQY.setFromAxisAngle( vectorFingerY, -rotX );
		} else if ( scope.screenOrientation == 180 ) {
			vectorFingerY = new THREE.Vector3( 1, 0, 0 );
			fingerQY.setFromAxisAngle( vectorFingerY, rotX );
		} else if ( scope.screenOrientation == 90 ) {
			vectorFingerY = new THREE.Vector3( 0, 1, 0 );
			fingerQY.setFromAxisAngle( vectorFingerY, rotX );
		} else if ( scope.screenOrientation == - 90) {
			vectorFingerY = new THREE.Vector3( 0, 1, 0 );
			fingerQY.setFromAxisAngle( vectorFingerY, -rotX );
		}
		q1.multiply( fingerQY );
		q1.multiply( fingerQX );
		euler.set( beta, alpha, - gamma, 'YXZ' ); // 手机获取的坐标是'ZXY'将其设置为'YXZ'给three用
		quaternion.setFromEuler( euler ); //拿到手机的方向
		quaternion.multiply( q1 ); //拿到对应摄像机的方向
		quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); //调整屏幕的方向
	};

	this.connect = function() {
		onScreenOrientationChangeEvent();
		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', this.update.bind( this ), false );
		scope.domElement.addEventListener( "touchstart", onTouchStartEvent, false );
		scope.domElement.addEventListener( "touchmove", onTouchMoveEvent, false );
		scope.enabled = true;

	};

	this.disconnect = function() {
		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', this.update.bind( this ), false );
		scope.domElement.removeEventListener( "touchstart", onTouchStartEvent, false );
		scope.domElement.removeEventListener( "touchmove", onTouchMoveEvent, false );
		scope.enabled = false;
	};

	this.update = function( ignoreUpdate ) {
		if ( scope.enabled === false ) return;
		var alpha = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) + this.alphaOffsetAngle : 0; // Z方向的数据
		var beta = scope.deviceOrientation.beta ? THREE.Math.degToRad( scope.deviceOrientation.beta ) : 0; // X方向的数据
		var gamma = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y方向的数据
		var orient = scope.screenOrientation ? THREE.Math.degToRad( scope.screenOrientation ) : 0; //矩阵里面的第三个
		setCameraQuaternion( scope.camera.quaternion, alpha, beta, gamma, orient );
		this.alpha = alpha;
	};

	this.updateAlphaOffsetAngle = function( angle ) {
		this.alphaOffsetAngle = angle;
		this.update();
	};

	this.dispose = function() {
		this.disconnect();
	};

};

/**
 * 全局初始化
 * @type {object}
 * @property {HTMLElement} options.container - html元素，这个就是主要的容器元素了，它必须是overflow：hidden
 * @property {Number} options.fov - 相机的焦距
 * @property {boolean} options.debug - 是否开启调试信息，开启对应实现点击console坐标点，关闭则不打印
 * @property {boolean} options.zoomspeed - 缩放的速度，默认为1
 */
XUNSHI.View = function(option)
{
    //配置信息的录入
    this.options = option;
    this.zoomspeed = 1;
    if(this.options.zoomspeed!=null)
    {
        this.zoomspeed = this.options.zoomspeed;
    }
    //创建导入器
    this.loader = new  THREE.TextureLoader()
    //初始化场景
    this.scene = new THREE.Scene();
    this.geometry = new THREE.SphereBufferGeometry( 500, 320, 320 );
    this.material = new THREE.MeshBasicMaterial();
    this.material.side = THREE.DoubleSide;
    this.sphere = new THREE.Mesh( this.geometry, this.material );
    this.panolens = [];
    this.idnow = null;
    this.scene.add( this.sphere );
    //初始化相机
    this.camera = new THREE.PerspectiveCamera(this.options.fov, this.options.container.clientWidth / this.options.container.clientHeight, 0.1, 1000);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 0;
    this.camera.lookAt({x:0,y:0,z:0});
    //初始化渲染器
    this.renderer = new THREE.WebGLRenderer( { antialias: true ,precision: "lowp"} );
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( this.options.container.clientWidth, this.options.container.clientHeight );
    this.renderer.setClearColor( 0x1b1b1b, 1 );
    this.renderer.gammaInput = true;
	this.renderer.gammaOutput = true;
    this.options.container.appendChild( this.renderer.domElement );
    //初始化控制器
    this.control = new THREE.OrbitControls(this.camera);
    this.control.panningMode = THREE.HorizontalPanning;
    this.control.minDistance = 0.0001;
    this.control.maxDistance = 0.0001;
    this.control.rotateSpeed = -0.3;

    //是否开启陀螺仪
    this.BeEnable = false;

    this.DeviceController = new XUNSHI.DeviceOrientationControls(this.camera,this.container);

    //初始化一个射线扫描器
    this.raycaster = new THREE.Raycaster();

    //缩放函数，一个是缩一个是放
    this.zoomin = function()
    {
        if(that.camera.fov>60)
        {
         that.camera.fov = that.camera.fov - (2*that.zoomspeed);
        }
    }
    this.zoomout = function()
    {
        if(that.camera.fov<120)
        {
         that.camera.fov = that.camera.fov + (2*that.zoomspeed);
        }
    }
    var that = this;
    //监听鼠标滚轮实现缩放
    this.options.container.addEventListener('mousewheel',function(e){
        if(e.wheelDelta>0){
            that.zoomin();
        }
        else{
            that.zoomout();
        }
    })
    //监听点击事件实现对点击点坐标的输出
    this.options.container.addEventListener('click',function(e){
        if(that.options.debug){
            var mouse = new THREE.Vector2();
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            that.raycaster.setFromCamera( mouse, that.camera );
            var intersects = that.raycaster.intersectObjects( [that.sphere] );
            if(intersects.length>0){
                console.log(intersects[0].point);
            }
        }
    })

    this.TouchZoom = function(event){
        console.log('xxxx')
    }

    //开启陀螺仪
    this.EnableGyroscope = function(){
        this.BeEnable = true;
        this.DeviceController.connect();
    }
    //关闭陀螺仪
    this.DisableGyroscope = function(){
        this.BeEnable = false;
        this.DeviceController.disconnect();
    }
    var change = 0;
    this.options.container.addEventListener( 'touchstart', function(){change = 0;}, false );
	this.options.container.addEventListener( 'touchmove', onTouchMove, false );
	this.options.container.addEventListener( 'touchend', function(){change = 0;}, false );
	function onTouchMove(event)
	{
		if(event.changedTouches.length > 1)
		{
			if(change == 0)
			{
				var a = new THREE.Vector2( event.changedTouches[0].clientX, event.changedTouches[0].clientY );
				var b = new THREE.Vector2( event.changedTouches[1].clientX, event.changedTouches[1].clientY );
				change = a.distanceTo(b);
			}
			else
			{
				var a = new THREE.Vector2( event.changedTouches[0].clientX, event.changedTouches[0].clientY );
				var b = new THREE.Vector2( event.changedTouches[1].clientX, event.changedTouches[1].clientY );
				var distance = change - a.distanceTo(b);
				if ( distance > 0 ) {
					that.camera.fov = ( that.camera.fov < 120 ) 
						? that.camera.fov + 2*that.zoomspeed
						: 120;
                        that.camera.updateProjectionMatrix();
				} else if ( distance < 0 ) {
					that.camera.fov = ( that.camera.fov > 60 ) 
						? that.camera.fov - 2*that.zoomspeed
						: 60;
                        that.camera.updateProjectionMatrix();
				}
				that.control.update();
				change = a.distanceTo(b);
			}
		}
    }
    
    this.projector = new THREE.Projector();
    
    //渲染tick
    this.Render = function()
    {
        if(that.InfoSpots.length>0){
            for(var i=0;i<that.InfoSpots.length;i++){
                var pos = that.InfoSpots[i].position.clone();
                var vector2d = pos.project(that.camera)
                var halfWidth = window.innerWidth / 2;
                var halfHeight = window.innerHeight / 2;
                that.InfoSpots[i].htmlelement.style.top = -vector2d.y * halfHeight + halfHeight + 'px';
                that.InfoSpots[i].htmlelement.style.left = vector2d.x * halfWidth + halfWidth + 'px';
            }
        }
        that.camera.updateProjectionMatrix();
        if(!that.BeEnable){
            that.control.update();
        }
        requestAnimationFrame(that.Render);
        that.renderer.render(that.scene, that.camera);
    }
    //开始渲染
    this.StartRender = function()
    {
        if(that.panolens.length>0){
            that.loader.load(that.panolens[0].img,function(data){
                that.material.map = data
                that.idnow = that.panolens[0].id;
                that.material.needsUpdate = true;
                that.material.map.needsUpdate = true;
            })
        }else
        {
            console.error("全景图数组不能为空")
            return;
        }
        that.Render()
    }
    //显示某一张全景图
    this.ShowPanolen = function(id){
        if(id==that.idnow)
        {
            return;
        }
        for(var i=0;i<that.panolens.length;i++)
        {
            if(that.panolens[i].id==id)
            {
                that.loader.load(that.panolens[i].img,function(data){
                    that.material.map = data;
                    that.idnow = id;
                    that.material.needsUpdate = true;
                })
            }
        }
    }
    //窗口大小重置
    this.onWindowResize = function()
    {
        that.camera.aspect = that.options.container.clientWidth / that.options.container.clientHeight;
        that.camera.updateProjectionMatrix();
        that.renderer.setPixelRatio(window.devicePixelRatio);
        that.renderer.setSize(that.options.container.clientWidth, that.options.container.clientHeight);
    }
    //获取全局的窗口缩放事件
    window.onresize = function(){
        that.onWindowResize()
    };
    //添加全景图对象
    this.add_panolens = function(panolen){
        this.panolens.push(panolen)
    }
    //所有的信息点，这个东西现在不由全景图管理，全部用视图去管理，因为就是html元素所有没有什么问题，也比较方便
    this.InfoSpots = [];
    //添加信息点
    this.AddInfoSpot = function(infospot){
        this.InfoSpots.push(infospot);
    }
    return this;
}
