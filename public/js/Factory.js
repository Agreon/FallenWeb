function Factory(game)
{
	this.objects = {};
	this.game = game;
	
	this.Init = function(){
		//var objs = JSON.parse('objects.json');
		
		var o = '{"GameObjects":[{ "name":"Player", "type":"Player", "attributes": { "health": 100, "dmg": 20, "speed": 5}},	{ "name":"Skeleton", "type":"Enemy", "attributes": { "health":20, "dmg":5  } },	{ "name":"Skeleton Archer", "type":"Enemy", "attributes": { "health":10, "dmg":10, "range": 20 } },{ "name":"Skeleton Mage", "type":"Enemy", "attributes": { "health":5, "dmg":15 } }]}';
		
		var objs = JSON.parse(o);
		
		for(var i = 0; i < objs.GameObjects.length; i++)
		{
			this.objects[objs.GameObjects[i].name] = objs.GameObjects[i];
		}
	};
		
	this.CreateObject = function(name){
		var obj = JSON.parse(JSON.stringify(this.objects[name]));
		obj.id = ++GO_IDs;
		obj.sprite = game.add.sprite(0,0,obj.name);
		obj = this.DefineMethods(obj);
		
		return obj;
	};
	
	this.DefineMethods = function(obj){
		
		if(obj.name == "Player"){
			obj.Print = function(val){
				console.log(val);
			};
			obj.Copy = function(){
				var newObj = {
					id: obj.id,
					name: obj.name,	
					type: obj.type,	
					attributes: obj.attributes,
					Print: obj.Print,
					Copy: obj.Copy
				};
				return newObj;	
			};
		}
		else if(obj.name == "Skeleton"){
			obj.Print = function(val){
				console.log(val);
			};
			obj.Copy = function(){
				var newObj = {
					id: obj.id,
					name: obj.name,	
					type: obj.type,	
					attributes: obj.attributes,
					Print: obj.Print,
					Copy: obj.Copy
				};
				return newObj;	
			};
		}
		else{
			obj.Print = function(val){
				console.log(val);
			};
			obj.Copy = function(){
				var newObj = {
					id: obj.id,
					name: obj.name,	
					type: obj.type,	
					attributes: obj.attributes,
					Print: obj.Print,
					Copy: obj.Copy
				};
				return newObj;	
			};
		}		
		return obj;	
	};	
}