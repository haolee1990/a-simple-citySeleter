/**@简单省市区选择控件，时间有限，投机取巧，写得拙劣
 * @Author：Leo 984018099@qq.com
 * @前方深坑，慎用
 **/
;(function($){

	//简单tap方案 callback必传
	$.fn.tap=function(callback){
		var _this=$(this);
		var startPoint,
			endPoint;
		_this.on({
			touchstart:function(e){
				e.preventDefault();
				e.stopPropagation();
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				startPoint=[touch.pageX,touch.pageY];
			},
			touchend:function(e){
				e.preventDefault();
				e.stopPropagation();
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				endPoint=[touch.pageX,touch.pageY];
				var distance=Math.sqrt(Math.pow(endPoint[0]-startPoint[0],2)+Math.pow(endPoint[1]-startPoint[1],2));
				if(distance < 10){
					callback(e);
				}
			}
		});
	}
	
	function Picker(dom,options){
		this.startY=0;
		this.endY=0;
		this.endSpeed=0;
		this.y=0;
		this.initY=80;
		this.dom=dom;
		this.options=options;
		this.speed=options.speed;
		this.itemHeight=dom.find(".picker-item").height();
		this.callback=options.callback;
	}
	
	Picker.prototype.init=function(){
		var _this=this,
			context=_this.dom;
		lockScreen();
		context.find(".picker-item").eq(0).addClass("active");
		var _oY=getComputeTranslateY(context);
		_oY=_oY?_oY:_this.initY;
		context.css({
			"-webkit-transform":"translate3d(0px,"+_oY+"px,0px)",
			"-webkit-transition-duration":"0s",
			"-webkit-transition-timing-function": "ease-out"
		});
		context.on({
			touchstart:function(e){
				e.preventDefault();
				e.stopPropagation();
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				var translateY=getComputeTranslateY(context);
				context.css({
					"-webkit-transform":"translate3d(0px,"+translateY+"px,0px)",
					"-webkit-transition-duration":"0s"
				});
				_this.startY=touch.pageY;
				_this.y=_this.startY;
			},
			touchmove:function(e){
				e.preventDefault();
				e.stopPropagation();
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				var dt_y=_this.y-touch.pageY;
				_this.y=touch.pageY;
				var newY=getComputeTranslateY(context)-dt_y;
				context.css({
					"-webkit-transform":"translate3d(0px,"+newY+"px,0px)",
				});
				_this.endSpeed=dt_y;
				var index=findPickedIndex(_this.itemHeight,newY);
				if(newY < _this.initY){
					calcCurrentItem(context,index);
				}	
			},
			touchend:function(e){
				e.preventDefault();
				e.stopPropagation();
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				_this.y=touch.pageY;
				_this.endY=_this.y;
				if(Math.abs(_this.endY-_this.startY) < 10){
					return;
				};
				var translateY=getComputeTranslateY(context);
				if(Math.abs(_this.endSpeed)>10){
					
					var calcY=(-_this.endSpeed)*_this.speed+translateY;
					
					if(calcY > _this.initY){
						calcY=_this.initY;
					}
					var minY=-(context.find(".picker-item").size()-3)*_this.itemHeight;
					if(calcY < minY){
						calcY=minY;
					}
					var index=findPickedIndex(_this.itemHeight,calcY);
					calcY=-index*_this.itemHeight+_this.initY;
					context.css({
						"-webkit-transform":"translate3d(0px,"+calcY+"px,0px)",
						"-webkit-transition-duration":"0.5s"
					});
					setTimeout(function(){
						calcCurrentItem(context,index);
					},500);
				}else{
				
					
					if(translateY > _this.initY){
						translateY=_this.initY;
					}
					var minY=-(context.find(".picker-item").size()-3)*_this.itemHeight;
					if(translateY < minY){
						translateY=minY;
					}
					var index=findPickedIndex(_this.itemHeight,translateY);
					translateY=-index*_this.itemHeight+_this.initY;
					context.css({
						"-webkit-transform":"translate3d(0px,"+translateY+"px,0px)",
						"-webkit-transition-duration":"0.5s"
					});
					calcCurrentItem(context,index);
				}
				if(_this.callback){
					_this.callback(context.find(".picker-item").eq(index),index)
				}
			}
		});
	}//init end
	function getComputeTranslateY(obj){
		var ret=0,
			style=obj.attr('style')||'';
		style=style.toLowerCase();
		if(style.indexOf('translate3d') != -1){
			ret=Number(style.split('translate3d(0px,')[1].split('px')[0]);
		}
		
		return ret;
	}
	
	function lockScreen(){
		$(window).on('touchmove.start',function(e){
			e.preventDefault();
			e.stopPropagation();
		});
	}

	function releaseScreen(){
		$(window).off('touchmove.start');
	}
	
	function findPickedIndex(itemHeight,translateY){
		var index=Math.abs(Math.round(translateY/itemHeight)-2);
		return index;
	}
	function calcCurrentItem(context,index){
		
		context.attr("data-picked-index",index);
		context.find(".picker-item").eq(index).addClass("active").siblings().removeClass("active");
		
	}
	
	$.fn.myPicker=function(options){
		var defaults={
			speed:20,
			callback:null
		}
		var opt=$.extend({},defaults,options);
		this.each(function(){
			var picker=new Picker($(this),opt);
			picker.init();
		});
	}
	
	function CityPicker(context,options){
		this.context=context;
		this.cancel=options.cancel;
		this.confirm=options.confirm;
		this.option=options;
	}
	function closePicker(){
		$(".picker-box").addClass("slideDown");
		var panel=$(".picker-panel");
		setTimeout(function(){
			panel.fadeOut(function(){
				panel.remove();
				$("html,body").removeClass("fixedWindow");
			});
		},300);
	}
	
	CityPicker.prototype.searchCityData=function(cityData,text){
		for(key in cityData){
			if(cityData[key].text==text){
				return cityData[key];
			}
		}
	}
	CityPicker.prototype.groupSerialize=function(group,text){
		group.find(".picker-item").each(function(){
			var $this=$(this);
			if($this.text()==text){
				$this.addClass("active").siblings().removeClass("active");
				group.css({
					"-webkit-transform":"translate3d(0px,"+(-($this.index()-2)*40)+"px,0px)",
					"-webkit-transition-duration":"0s"
				});
				return false;
			}
		});
	}
	CityPicker.prototype.checkDefault=function(cityData,option){
		var provList='',
			cityList='',
			distList='',
			provInfo,
			cityInfo,
			distInfo,
			provGroup=$(".picker-wrap .cloud1"),
			cityGroup=$(".picker-wrap .cloud2"),
			distGroup=$(".picker-wrap .cloud3"),
			provTag,
			cityTag,
			distTag;
		if(option.prov&&option.city){
			try{
				provInfo=this.searchCityData(cityData,option.prov);
	
				cityInfo=this.searchCityData(provInfo.children,option.city);
	
	//			distInfo=searchCityData(cityInfo.children,option.dist);
	
				for(key in provInfo.children){
					cityList+='<div class="picker-item">'+provInfo.children[key].text+'</div>';
				}
				for(key in cityInfo.children){
					distList+='<div class="picker-item">'+cityInfo.children[key].text+'</div>';
				}
				
				cityGroup.html(cityList).css({
					"-webkit-transform":"translate3d(0px,80px,0px)",
					"-webkit-transition-duration":"0s"
				});
				
				distGroup.html(distList).css({
					"-webkit-transform":"translate3d(0px,80px,0px)",
					"-webkit-transition-duration":"0s"
				});
				
				this.groupSerialize(provGroup,option.prov);
				this.groupSerialize(cityGroup,option.city);
				this.groupSerialize(distGroup,option.dist);
			}catch(e){
				return;
			}
		}
	}
	CityPicker.prototype.init=function(data){
		var _this=this;
		var context=this.context;
		var option=this.option;
		var cityData=data;
		var provList='',
			cityList='',
			distList='';
		var cityInfo,
			distInfo;
		for(key in cityData){
			provList+='<div class="picker-item">'+cityData[key].text+'</div>';
		}
		for(key in cityData[0].children){
			cityList+='<div class="picker-item">'+cityData[0].children[key].text+'</div>';
		}
		for(key in cityData[0].children[0].children){
			distList+='<div class="picker-item">'+cityData[0].children[0].children[key].text+'</div>';
		}
		
		var temp='<div class="picker-panel">'+
					'<div class="picker-box">'+
						'<div class="hd">'+
							'<a href="javascript:;" class="picker-cancel-btn">取消</a>'+
							'请选择区域'+
							'<a href="javascript:;" class="picker-ok-btn">确定</a>'+
						'</div>'+
						'<div class="picker-action"></div>'+
						'<div class="picker-wrap">'+
							'<div class="inner cloud1">'+provList+						
							'</div>'+
							'<div class="inner cloud2">'+cityList+
							'</div>'+
							'<div class="inner cloud3">'+distList+
							'</div>'+
							
						'</div>'+
					'</div>'+
				'</div>';
		
		context.tap(function(e){
			e.preventDefault();
			e.stopPropagation();
			$("html,body").addClass("fixedWindow");
			$("body").append(temp);
			var provGroup=$(".picker-wrap .cloud1"),
				cityGroup=$(".picker-wrap .cloud2"),
				distGroup=$(".picker-wrap .cloud3"),
				cancelBtn=$(".picker-cancel-btn"),
				okBtn=$(".picker-ok-btn");
			
			provGroup.myPicker({
				speed:option.speed,
				callback:function(obj,index){
					prov=obj.text();
					var city=_this.searchCityData(cityData,prov);
					cityInfo=city.children;
					cityList='';
					distList='';
					for(key in city.children){
						cityList+='<div class="picker-item">'+city.children[key].text+'</div>';
					}
					for(key in city.children[0].children){
						distList+='<div class="picker-item">'+city.children[0].children[key].text+'</div>';
					}
					cityGroup.html(cityList).css({
						"-webkit-transform":"translate3d(0px,80px,0px)",
						"-webkit-transition-duration":"0s"
					});
					cityGroup.find(".picker-item").eq(0).addClass("active");
					distGroup.html(distList).css({
						"-webkit-transform":"translate3d(0px,80px,0px)",
						"-webkit-transition-duration":"0s"
					});
					distGroup.find(".picker-item").eq(0).addClass("active")
				}
			});
			cityGroup.myPicker({
				speed:option.speed,
				callback:function(obj,index){
					city=obj.text();
					var dist=_this.searchCityData(cityInfo,city);
				    if(!dist){
				    	var provObj=_this.searchCityData(cityData,provGroup.find(".active").text());
				    	var cityObj=_this.searchCityData(provObj.children,city);
						dist=cityObj;
				    }
					distList='';
					for(key in dist.children){
						distList+='<div class="picker-item">'+dist.children[key].text+'</div>';
					}
					distGroup.html(distList).css({
						"-webkit-transform":"translate3d(0px,80px,0px)",
						"-webkit-transition-duration":"0s"
					});
					distGroup.find(".picker-item").eq(0).addClass("active")
				}
			});
			distGroup.myPicker({
				speed:option.speed,
				callback:function(obj,index){
					dist=obj.text();
				}
			});
			_this.checkDefault(cityData,option);
			cancelBtn.tap(function(e){
				e.preventDefault();
				e.stopPropagation();
				if(option.cancel){
					option.cancel({
						prov:provGroup.find(".active").text(),
						city:cityGroup.find(".active").text(),
						dist:distGroup.find(".active").text()
					});
				}
				closePicker();
			});
			okBtn.tap(function(e){
				e.preventDefault();
				e.stopPropagation();
				if(option.confirm){
					option.confirm({
						prov:provGroup.find(".active").text(),
						city:cityGroup.find(".active").text(),
						dist:distGroup.find(".active").text()
					});
				}
				closePicker();
			});
		});
	}
	$.fn.cityPicker=function(options){
		var defaults={
			speed:20,
			cancel:null,
			confirm:null,
			prov:null,
			city:null,
			dist:null
		}
		var opt=$.extend({},defaults,options);
		this.each(function(){
			var citypicker=new CityPicker($(this),opt);
			$.getJSON('../plugin/cityPicker/city.data.min.js',function(data){
			    citypicker.init(data.data);
			});	
		});
	}
	
})(jQuery);
