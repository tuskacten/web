import React, { useState, useEffect } from "react";
import './App.css';
import Axios from "axios";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


function App() {
  const [task, setTask] = useState("");
  const [taskList, setTaskList] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [warning, setWarning] = useState("");


  useEffect(() => {
    // Gửi yêu cầu GET đến máy chủ để lấy danh sách nhiệm vụ
    Axios.get("http://localhost:3001/api/get")
      .then((response) => {
        const tasks = response.data;
        setTaskList(tasks);
        updateCounter(tasks);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(taskList));
    updateCounter(taskList);
  }, [taskList]);

  const submitTask = () => {
    if (task.trim() === "") {
      setWarning("Please enter a task before adding.");
      return; 
    }
  
    Axios.post("http://localhost:3001/api/insert", { task })
      .then((response) => {
        if (response.data.success) {
          const newTaskList = [...taskList, { task, completed: false }];
          setTaskList(newTaskList);
          setTask("");
          setWarning(""); 
          setIsCleared(false);
        }
      })
      .catch((error) => {
        console.error("Error adding task:", error);
      });
  };
  
  const deleteTask = (taskToDelete) => {
    // Gửi yêu cầu DELETE đến máy chủ để xóa nhiệm vụ
    Axios.delete(`http://localhost:3001/api/delete/${taskToDelete}`)
      .then((response) => {
        if (response.data.success) {
          // Nếu thành công, cập nhật danh sách nhiệm vụ
          const newTaskList = taskList.filter((val) => val.task !== taskToDelete);
          setTaskList(newTaskList);
          setIsCleared(false);
        }
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
      });
  };

  const clearList = () => {
    Axios.delete("http://localhost:3001/api/clear")
      .then((response) => {
        if (response.data.success) {
          setTaskList([]);
          setIsCleared(true);
          updateCounter([]);
        }
      })
      .catch((error) => {
        console.error("Error clearing list:", error);
      });
  };

  const toggleCompletion = (taskToToggle) => {
    Axios.put(`http://localhost:3001/api/update/${taskToToggle.task}`, {
      newTask: taskToToggle.task,
    })
      .then((response) => {
        if (response.data.success) {
          const updatedTaskList = taskList.map((taskItem) => {
            if (taskItem.task === taskToToggle.task) {
              return { ...taskItem, completed: !taskItem.completed };
            }
            return taskItem;
          });

          setTaskList(updatedTaskList);
          setIsCleared(false);
        }
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && task.trim() !== "") {
      submitTask();
    }
  };
  const updateCounter = (updatedTaskList) => {
    const completedTasksCount = updatedTaskList.filter((taskItem) => taskItem.completed).length;
    const totalTasksCount = updatedTaskList.length;
    setCompletedTasks(completedTasksCount);
    setTotalTasks(totalTasksCount);
  };

  const onDragEnd = (result) => {
     if (!result.destination) { return; }

const reorderedTasks = [...taskList];
const [reorderedTask] = reorderedTasks.splice(result.source.index, 1);
reorderedTasks.splice(result.destination.index, 0, reorderedTask);

setTaskList(reorderedTasks);


fetch("/api/reorder", {
  method: "put",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ tasks: reorderedTasks.map((task) => task.task) }),
});

};


  return (
    <div className="container">
      <div className="todo-app">
        <div className="header">
          <h2>To-Do List</h2>
          <button onClick={clearList} id="clear-button">
            Clear
          </button>
          <button onClick={submitTask} id="add-button" style={{ float: "left" }}>
            Add
          </button>
          <p className="p-count">Task: {completedTasks}/{totalTasks}</p>
        </div>
        <div className="row">
          <input
            type="text"
            name="task"
            value={task}
            onChange={(e) => {
              setTask(e.target.value);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Add your text"
          />
          {warning && <p className="warning-message">{warning}</p>}
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="taskList">
            {(provided) => (
              <ul
                id="list-container"
                style={{ clear: "both" }}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {taskList.map((taskItem, index) => (
                  <Draggable
                    key={taskItem.task}
                    draggableId={taskItem.task}
                    index={index}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={taskItem.completed ? "completed" : ""}
                      >
                        <span onClick={() => toggleCompletion(taskItem)}>
                          {taskItem.task}
                        </span>
                        <button onClick={() => deleteTask(taskItem.task)} id="delete-button">
                          Delete
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        {isCleared && <p className="cleared-message">List cleared!</p>}
      </div>
    </div>
  );
}


export default App;