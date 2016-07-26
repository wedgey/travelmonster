<?php
	require_once '../db/db_functions.php';
	
	function createMessageGroup($senderid,array $recipientsid) {
		$sender = db_quote($senderid);
		$numberofusers = count($recipientsid) + 1;
		$sql_query = "INSERT INTO messagegroups (size) VALUES ('$numberofusers')";
		if(db_query($sql_query)) {
			$groupid = db_get_last_insert_id();
			$sql_messageusergroups_query = "INSERT INTO messageusergroups (userid,groupid) VALUES ";
			foreach($recipientsid as $indiv_recipient) {
				$recipient = db_quote($indiv_recipient);
				$sql_messageusergroups_query .= "('$recipient','$groupid'),";
			}
			$sql_messageusergroups_query .= "('$sender','$groupid')";
			$messageusergroups_query = db_query($sql_messageusergroups_query);
			if($messageusergroups_query == false) {
				return false;
			} else {
				return $groupid;
			}
		}
	}

	function getMessages($groupid) {
		$group = db_quote($groupid);
		$sql_query = "SELECT * FROM messages WHERE groupid=$group ORDER BY senddate DESC";
		$query = db_select($sql_query);
		return $query;
	}

	function getMessageGroup($senderid,array $recipientsid) {
		$sender = db_quote($senderid);
		$numberofusers = count($recipientsid) + 1;
		$sql_query = "SELECT a.groupid,a.userid,b.size FROM messageusergroups AS a LEFT JOIN messagegroups as b ON a.groupid=b.id WHERE a.groupid IN (SELECT groupid FROM messageusergroups WHERE userid IN (";
		foreach($recipientsid as $recipientid) {
			$recipient = db_quote($recipientid);
			$sql_query .= "'$recipient',";
		}
		$sql_query .= "'$sender') GROUP BY groupid HAVING COUNT(groupid) = $numberofusers) AND b.size='2' GROUP BY a.groupid";
		$query = db_select($sql_query);
		if($query === false) {
			return false;
		} else {
			if(count($query) == 1) {
				return $query[0]['groupid'];
			} else if(count($query) == 0) {
				return createMessageGroup($senderid, $recipientsid);
			} else {
				return false;
			}
		}
	}

	function getGroups($senderid) {
		$sender = db_quote($senderid);
		$sql_query = "SELECT groupid FROM messageusergroups WHERE userid='$sender'";
		return db_select($sql_query);
	}

	function getGroupsUsers($senderid) {
		$groups = getGroups($senderid);
		$sql_query = "SELECT * FROM messageusergroups WHERE groupid IN (";
		foreach($groups as $group) {
			$groupid = db_quote($group['groupid']);
			$sql_query .= "'$groupid',";
		}
		$sql_query2 = substr($sql_query, 0, -1) . ") AND deleted='0'";
		$query = db_select($sql_query2);
		if($query !== false) {
			$convos = array();
			$current_group = $query[0]['groupid'];
			$convos[$current_group] = array();
			foreach($query as $row) {
				if($row['userid'] != $senderid && $row['groupid'] == $current_group) {
					array_push($convos[$current_group],$row['userid']);
				} else if($row['userid'] != $senderid && $row['groupid'] != $current_group) {
					$current_group = $row['groupid'];
					$convos[$current_group] = array();
					array_push($convos[$current_group],$row['userid']);
				}
			}
			return $convos;
		} else {
			return false;
		}
	}

	function displayMultipleGroupTitle() {
		$groups = getGroupsUsers($_SESSION['userid']);
		$userids = array();
		foreach($groups as $group) {
			$userids = array_merge($userids, $group);
		}
		$sql_ids_prepare = implode("','", array_unique($userids));

		$sql_query = "SELECT id,firstname,lastname FROM users WHERE id IN ('$sql_ids_prepare')";
		$query = db_select($sql_query);
		if($query !== false) {
			$username_table = array();
			foreach($query as $usermap) {
				$username_table[$usermap['id']] = $usermap['firstname'] . " " . $usermap['lastname'];
			}
		}
		$group_chats = array();
		foreach($groups as $groupid => $usergroups) {
			$group_chats[$groupid] = array();
			foreach($usergroups as $id) {
				array_push($group_chats[$groupid],$username_table[$id]);
			}
		}
		return $group_chats;
	}

	function formatDisplay() {
		$group_titles = displayMultipleGroupTitle();
		$output = "";
		if($group_titles !== false) {
			foreach($group_titles as $groupid => $group) {
				$output .= "<div class='message_group'>" . htmlspecialchars(implode(", ", $group)) . "</div>";
				$messages = getMessages($groupid);
				$output .= "<div class='messages'><ul>";
				foreach($messages as $message) {
					$output .= "<li> " . $message['message'] . " </li>";
				}
				$output .= "</ul></div>";

			}
		} else {
			return false;
		}
		return $output;
	}

	function createMessage($passed_recipients, $passed_message) {
		$message = db_quote($passed_message);
		$senderid = $_SESSION['userid'];
		$errors = "";
		$returnString = "";
		if(strlen($passed_recipients) > 0) {
			$recipients = explode(",",$passed_recipients);

			//Get groupid of messagegroup
			$groupid = getMessageGroup($senderid,$recipients);
			if($groupid == false) {
				return "Sorry, we couldn't make the group for your conversation.";
			}

			//Prepare and insert message
			$sql_message = "INSERT INTO messages (senderid,message,groupid) VALUES ('$senderid', '$message','$groupid')";
			if(db_query($sql_message)) {
				$messageid = db_get_last_insert_id();

				//Prepare and insert recipients 
				foreach ($recipients as $indiv_recipient) {
					$recipient = db_quote($indiv_recipient);
					$sql_recipient_test = "SELECT id FROM users WHERE id='$recipient'";
					$recipient_test = db_select($sql_recipient_test);
					if($recipient_test !== false && count($recipient_test) > 0) {
						$sql_recipients = "INSERT INTO messagerecipients (messageid, recipientid, status) VALUES ('$messageid', '$recipient', 'unread')";
						if(!db_query($sql_recipients)) {
							$errors .= $recipient;
						}
					} else {
						$errors .= "Non-existing($recipient)";
					}
				}
				if(strlen($errors) > 0) {
					return "Message sent but not to these recipients: $errors";
				} else {
					return "Message sent.";
				}
			} else {
				return "Couldn't send the message.";
			}
		} else {
			return "No recipients given.";
		}
	}
?>