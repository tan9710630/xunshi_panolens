XUNSHI_DeviceControl={VERSION:1.0}
//单独封一下控制器，这个东西后面估计还有用，比较NB
XUNSHI_DeviceControl.DeviceOrientationControls = function( camera, domElement ) {
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