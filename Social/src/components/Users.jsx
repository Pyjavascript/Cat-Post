import {useState,useEffect} from "react";

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/users",{
      method:"GET",
      headers:{
        "Content-Type":"application/json"
      }
    }).then((response)=>{
      if(!response.ok){
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
    ).then((data)=>{
      setUsers(data);
    }).catch((error)=>{
      console.error("Error fetching users:",error);
      
    })
  })

  return (
    <div className="h-full w-full bg-white">
     <div className="flex justify-between items-center p-3">
     <h1 className="text-2xl font-extrabold">All Users</h1>
      <div className="flex items-center justify-center text-3xl">
      <ion-icon name="chevron-forward-circle-outline"></ion-icon>
      </div>
     </div>

      <div className="w-full p-3">
        {
          users ? users.map((elem,ind) => (
            <div className="w-full bg-white p-2 px-0 flex items-center gap-3">
          <div className="h-12 w-12 bg-amber-400 rounded-full">
            <img src={elem.photo ? elem.photo : ""} alt="" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-xl">{elem.name}</h1>
            <p className="-mt-1 w-1/2 overflow-hidden">{elem.email}</p>
          </div>
          <button className="bg-red-400 text-white p-1 px-3 rounded-full">Follow</button>
        </div>
          )) : "No users found"
        }
      </div>
    </div>
  );
}

export default Users;
