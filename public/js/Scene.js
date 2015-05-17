function Scene()
{
	this.objects = {"Enemy": [], "Player": []};
	
	this.AddObject = function(obj,type){
		this.objects[type].push(obj);
	};
	
	this.AddObjectXY = function(obj,x,y){
		obj.sprite.x = x;
		obj.sprite.y = y;
		this.objects[obj.type].push(obj);
	};
	
	/*
		Returns all objects of a type
	*/
	this.GetObjects = function(type){
		return this.objects[type];	
	};
	
	this.GetFirstObject = function (type) {
		return this.objects[type][0];
	};
	
	this.GetLastAdded = function(type){
		return this.objects[type][this.objects[type].length-1];
	};
	
	
	/*
		Returns an Object by ID
	*/
	this.GetObject = function(id){
		
		for(var key in this.objects)
		{
			if(this.objects.hasOwnProperty(key) == false)
				continue;
			
			for(var i = 0; i < this.objects[key].length; i++)
			{
				if(this.objects[key][i].id == id)
				{
					return this.objects[key][i];
				}			
			}	
		}
		
		//return 0;
	};
	
	this.RemoveObject = function(id){
		for(var key in this.objects)
		{
			if(this.objects.hasOwnProperty(key) == false)
				continue;
			
			for(var i = 0; i < this.objects[key].length; i++)
			{
				if(this.objects[key][i].id == id)
				{
					this.objects[key][i].sprite.destroy(true);
					this.objects[key].splice(i,1);
					//delete this.objects[key][i];
					return;
				}			
			}	
		}	
	};
	
}